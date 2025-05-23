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
  //* Asegurarnos de que cualquier header sea JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    //? 1) Método
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ message: "Método no permitido. Usa POST." });
    }

    //? 2) Body válido
    const { folio } = req.body;
    if (!folio) {
      return res
        .status(400)
        .json({ message: "Folio es requerido." });
    }

    //? 3) Conexión y consulta de la consulta
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

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        message: "El folio de consulta no es válido o no tiene el estatus requerido.",
      });
    }

    //? 4) Consulta de incapacidades
    const incapResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT fecha, fechainicio, fechafin, nombrepaciente, departamento, edad, observaciones, claveMedico
        FROM incapacidades
        WHERE claveconsulta = @folio
          AND estatus = 1
      `);

    if (!incapResult.recordset.length) {
      return res.status(404).json({
        message: "Incapacidad no encontrada."
      });
    }

    //? 5) Formateo y proveedor
    const incap = incapResult.recordset[0];
    const fecha     = formatFecha(incap.fecha);
    const fechaini  = formatFecha(incap.fechainicio);
    const fechafin  = formatFecha(incap.fechafin);

    const proveedorResult = await pool
      .request()
      .input("claveMedico", sql.Int, incap.claveMedico)
      .query(`
        SELECT nombreproveedor 
        FROM proveedores 
        WHERE claveproveedor = @claveMedico
      `);

    const nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    //? 6) Respuesta 200
    return res.status(200).json({
      data: {
        fecha,
        fechainicio: fechaini,
        fechafinal:   fechafin,
        nombrepaciente: incap.nombrepaciente,
        departamento:   incap.departamento,
        edad:           incap.edad,
        nombreproveedor,
        observaciones:  incap.observaciones,
      },
    });

  } catch (error) {
    //? 7) Cualquier excepción cae aquí y devolvemos JSON
    console.error("💥 Error inesperado en buscarIncapacidad:", error);
    return res.status(500).json({
      message: "Error al buscar la incapacidad",
      error:   error.message,
    });
  }
}
