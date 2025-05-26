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

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  //! Forzar siempre JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //? 1️⃣ Sólo POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido. Usa POST." });
  }

  //? 2️⃣ Parsear body
  let body;
  try {
    body = req.body;
  } catch {
    return res
      .status(400)
      .json({ success: false, message: "Body JSON inválido." });
  }

  const { folio } = body;
  if (!folio) {
    return res
      .status(400)
      .json({ success: false, message: "Folio es requerido." });
  }

  try {
    //? 3️⃣ Conectar y verificar consulta válida (estatus 2, sin diagnóstico)
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
      return res
        .status(404)
        .json({
          success: false,
          message: "El folio de consulta no es válido o no cumple los requisitos.",
        });
    }

    //? 4️⃣ Obtener incapacidad
    const incapResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT fecha, fechainicio, fechafin,
               nombrepaciente, departamento, edad,
               observaciones, claveMedico
        FROM incapacidades
        WHERE claveconsulta = @folio
          AND estatus = 1
      `);

    if (!incapResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Incapacidad no encontrada." });
    }

    //? 5️⃣ Formatear fechas y buscar proveedor
    const row = incapResult.recordset[0];
    const fecha       = formatFecha(row.fecha);
    const fechainicio = formatFecha(row.fechainicio);
    const fechafinal  = formatFecha(row.fechafin);

    const proveedorResult = await pool
      .request()
      .input("claveMedico", sql.Int, row.claveMedico)
      .query(`
        SELECT nombreproveedor
        FROM proveedores
        WHERE claveproveedor = @claveMedico
      `);
    const nombreproveedor = proveedorResult.recordset[0]?.nombreproveedor || null;

    //? 6️⃣ Responder OK
    return res.status(200).json({
      success: true,
      data: {
        fecha,
        fechainicio,
        fechafinal,
        nombrepaciente: row.nombrepaciente,
        departamento:   row.departamento,
        edad:           row.edad,
        nombreproveedor,
        observaciones:  row.observaciones,
      },
    });
  } catch (error) {
    console.error("💥 Error inesperado en buscarIncapacidad:", error);
    return res.status(500).json({
      success: false,
      message: "Error al buscar la incapacidad",
      error:   error.message,
    });
  }
}
