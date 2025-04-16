import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana en español
function formatFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  //* Obtener los valores en UTC para preservar la hora exacta de la base de datos
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

  const { noNomina, folioConsulta } = req.body;
  if (!noNomina) {
    return res
      .status(400)
      .json({ message: "El parámetro noNomina es requerido" });
  }
  if (!folioConsulta) {
    return res
      .status(400)
      .json({ message: "El parámetro folioConsulta es requerido" });
  }

  try {
    const pool = await connectToDatabase();

    // console.log(
    //   `🔍 Buscando datos en detalleIncapacidad para noNomina: ${noNomina}`
    // );

    //* Asegúrate de usar el nombre correcto para la variable en la consulta
    const incapacidadResult = await pool
      .request()
      .input("noNomina", sql.NVarChar, noNomina)
      .input("folioConsulta", sql.Int, folioConsulta) 
      .query(`
        SELECT fechaInicial, fechaFinal, diagnostico, claveMedico, claveConsulta, estatus
        FROM detalleIncapacidad 
        WHERE noNomina = @noNomina 
          AND estatus = 1 
          AND fechaInicial IS NOT NULL 
          AND fechaFinal IS NOT NULL
          AND claveMedico IS NOT NULL
          AND claveConsulta = @folioConsulta
      `);

    if (incapacidadResult.recordset.length === 0) {
      //console.log("⚠️ No se encontraron registros válidos.");
      return res
        .status(404)
        .json({
          message:
            "No se encontraron registros válidos para la nómina proporcionada.",
        });
    }

    const incapacidad = incapacidadResult.recordset[0];
    const fechaInicialFormato = formatFecha(incapacidad.fechaInicial);
    const fechaFinalFormato = formatFecha(incapacidad.fechaFinal);

    let nombreProveedor = "No disponible";
    let claveEspecialidad = null;
    let especialidad = "No disponible";

    //* Buscar nombre del médico y claveEspecialidad en proveedores
    if (incapacidad.claveMedico) {
      // console.log(
      //   `🔎 Buscando proveedor con claveMedico: ${incapacidad.claveMedico}`
      // );

      const medicoResult = await pool
        .request()
        .input("claveMedico", sql.Int, incapacidad.claveMedico).query(`
          SELECT nombreproveedor, claveespecialidad 
          FROM proveedores 
          WHERE claveproveedor = @claveMedico
        `);

      if (medicoResult.recordset.length > 0) {
        nombreProveedor = medicoResult.recordset[0].nombreproveedor;
        claveEspecialidad = medicoResult.recordset[0].claveespecialidad;
      }
    }

    //* Buscar la especialidad en la tabla especialidades
    if (claveEspecialidad) {
      // console.log(
      //   `🔎 Buscando especialidad con claveEspecialidad: ${claveEspecialidad}`
      // );

      const especialidadResult = await pool
        .request()
        .input("claveespecialidad", sql.Int, claveEspecialidad).query(`
          SELECT especialidad 
          FROM especialidades 
          WHERE claveespecialidad = @claveespecialidad
        `);

      if (especialidadResult.recordset.length > 0) {
        especialidad = especialidadResult.recordset[0].especialidad;
      }
    }

    // console.log("✅ Datos obtenidos con éxito:", {
    //   fechaInicialFormato,
    //   fechaFinalFormato,
    //   fechaInicial: incapacidad.fechaInicial,
    //   fechaFinal: incapacidad.fechaFinal,
    //   diagnostico: incapacidad.diagnostico,
    //   medico: nombreProveedor,
    //   especialidad,
    //   claveConsulta: incapacidad.claveConsulta,
    //   claveMedico: incapacidad.claveMedico,
    // });

    return res.status(200).json({
      fechaInicialFormato,
      fechaFinalFormato,
      fechaInicial: incapacidad.fechaInicial,
      fechaFinal: incapacidad.fechaFinal,
      diagnostico: incapacidad.diagnostico,
      medico: nombreProveedor,
      especialidad,
      claveConsulta: incapacidad.claveConsulta,
      claveMedico: incapacidad.claveMedico,
    });
  } catch (error) {
    console.error(
      "❌ Error en el endpoint de captura de incapacidades:",
      error
    );
    return res
      .status(500)
      .json({
        message: "Error al obtener los datos de incapacidad",
        error: error.message,
      });
  }
}
