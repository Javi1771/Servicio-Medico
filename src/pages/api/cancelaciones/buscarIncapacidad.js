import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  const date = new Date(fecha);
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;

  //* Log de lo que recibimos en el body
  //console.log("Request body:", req.body);

  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    const consultaResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT claveconsulta 
        FROM consultas 
        WHERE claveconsulta = @folio 
          AND clavestatus = 2
          AND diagnostico IS NULL
      `);

    //* Log de lo que devuelve consultaResult
    //console.log("consultaResult.recordset:", consultaResult.recordset);

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        message: "El folio de consulta no es válido o no tiene el estatus requerido.",
      });
    }

    const incapResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT fecha, fechainicio, fechafin, nombrepaciente, departamento, edad, observaciones, claveMedico
        FROM incapacidades
        WHERE claveconsulta = @folio
          AND estatus = 1
      `);

    //* Log de lo que devuelve incapResult
    //console.log("incapResult.recordset:", incapResult.recordset);

    if (!incapResult.recordset.length) {
      return res.status(404).json({ message: "Incapacidad no encontrada." });
    }

    const incap = incapResult.recordset[0];
    //console.log("Incapacidad obtenida:", incap);

    const fechaFormateada = formatFecha(incap.fecha);
    const fechainicioFormateada = formatFecha(incap.fechainicio);
    const fechafinFormateada = formatFecha(incap.fechafin);

    const proveedorResult = await pool
      .request()
      .input("claveMedico", sql.Int, incap.claveMedico)
      .query(`SELECT nombreproveedor FROM proveedores WHERE claveproveedor = @claveMedico`);

    //console.log("proveedorResult.recordset:", proveedorResult.recordset);

    const nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    const responseData = {
      data: {
        fecha: fechaFormateada,
        fechainicio: fechainicioFormateada,
        fechafinal: fechafinFormateada,
        nombrepaciente: incap.nombrepaciente,
        departamento: incap.departamento,
        edad: incap.edad,
        nombreproveedor,
        observaciones: incap.observaciones,
      },
    };

    //* Log de lo que estamos retornando
    //console.log("Response data:", responseData);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error al buscar incapacidad:", error);
    return res.status(500).json({
      message: "Error al buscar la incapacidad",
      error: error.message,
    });
  }
}
