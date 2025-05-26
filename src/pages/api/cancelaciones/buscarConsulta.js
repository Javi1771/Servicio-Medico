import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

//* Formatea fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ];
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

  const { folio, tipo } = body;
  if (!folio || !tipo) {
    return res
      .status(400)
      .json({ success: false, message: "Folio y tipo son requeridos." });
  }

  if (tipo === "consultaGeneral") {
    return res.status(400).json({
      success: false,
      message:
        "El tipo 'consultaGeneral' no es permitido. Usa 'paseEspecialidad'.",
    });
  }

  try {
    const pool = await connectToDatabase();

    //? 3️⃣ Consulta de pase a especialidad
    let consultaQuery = `
      SELECT nombrepaciente, edad, departamento,
             claveproveedor, especialidadinterconsulta, fechacita
      FROM consultas
      WHERE claveconsulta = @folio
        AND clavestatus = 2
        AND diagnostico IS NULL
        AND motivoconsulta IS NULL
        AND seasignoaespecialidad IS NOT NULL
    `;
    if (tipo === "paseEspecialidad") {
      consultaQuery +=
        " AND especialidadinterconsulta IS NOT NULL AND fechacita IS NOT NULL";
    }

    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, parseInt(folio, 10))
      .query(consultaQuery);

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        success: false,
        message:
          "Consulta no encontrada o no corresponde a un pase a especialidad.",
      });
    }

    const row = consultaResult.recordset[0];

    //? 4️⃣ Nombre del proveedor
    const provRes = await pool
      .request()
      .input("claveproveedor", sql.Int, row.claveproveedor)
      .query(
        `SELECT nombreproveedor FROM proveedores WHERE claveproveedor = @claveproveedor`
      );
    const nombreproveedor = provRes.recordset[0]?.nombreproveedor || null;

    //? 5️⃣ Especialidad
    let especialidad = null;
    if (row.especialidadinterconsulta) {
      const espRes = await pool
        .request()
        .input("claveespecialidad", sql.Int, row.especialidadinterconsulta)
        .query(
          `SELECT especialidad FROM especialidades WHERE claveespecialidad = @claveespecialidad`
        );
      especialidad = espRes.recordset[0]?.especialidad || null;
    }

    //? 6️⃣ Responder OK
    return res.status(200).json({
      success: true,
      data: {
        nombrepaciente:    row.nombrepaciente,
        edad:              row.edad,
        departamento:      row.departamento,
        nombreproveedor,
        especialidad,
        fechacita:         formatFecha(row.fechacita),
      },
    });
  } catch (error) {
    console.error("💥 Error inesperado en buscarConsulta:", error);
    return res.status(500).json({
      success: false,
      message: "Error al buscar la consulta",
      error:   error.message,
    });
  }
}
