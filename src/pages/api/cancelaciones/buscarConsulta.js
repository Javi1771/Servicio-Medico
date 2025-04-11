import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);

  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio, tipo } = req.body;
  if (!folio || !tipo) {
    return res.status(400).json({ message: "Folio y tipo son requeridos." });
  }

  if (tipo === "consultaGeneral") {
    return res.status(400).json({
      message: "El tipo 'consultaGeneral' no es permitido. Use 'paseEspecialidad'."
    });
  }

  try {
    const pool = await connectToDatabase();

    let consultaQuery = `
      SELECT nombrepaciente, edad, departamento, claveproveedor, especialidadinterconsulta, fechacita
      FROM consultas
      WHERE claveconsulta = @folio
        AND clavestatus = 2
        AND diagnostico IS NULL
        AND motivoconsulta IS NULL
        AND seasignoaespecialidad IS NOT NULL
    `;
    if (tipo === "paseEspecialidad") {
      consultaQuery += " AND especialidadinterconsulta IS NOT NULL AND fechacita IS NOT NULL";
    }

    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, parseInt(folio, 10))
      .query(consultaQuery);

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        message: "Consulta no encontrada o los datos no coinciden con un pase a especialidad."
      });
    }

    const consulta = consultaResult.recordset[0];

    const proveedorResult = await pool
      .request()
      .input("claveproveedor", sql.Int, consulta.claveproveedor)
      .query(`SELECT nombreproveedor FROM proveedores WHERE claveproveedor = @claveproveedor`);

    let nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    let especialidad = null;
    if (consulta.especialidadinterconsulta) {
      const espResult = await pool
        .request()
        .input("claveespecialidad", sql.Int, consulta.especialidadinterconsulta)
        .query(`SELECT especialidad FROM especialidades WHERE claveespecialidad = @claveespecialidad`);
      if (espResult.recordset.length) {
        especialidad = espResult.recordset[0].especialidad;
      }
    }

    return res.status(200).json({
      data: {
        nombrepaciente: consulta.nombrepaciente,
        edad: consulta.edad,
        departamento: consulta.departamento,
        nombreproveedor,
        especialidad,
        fechacita: formatFecha(consulta.fechacita),
      },
    });
  } catch (error) {
    console.error("Error al buscar consulta:", error);
    return res.status(500).json({
      message: "Error al buscar la consulta",
      error: error.message,
    });
  }
}
