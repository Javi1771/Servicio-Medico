import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { noNomina, nombrePaciente } = req.query;

  if (!noNomina || !nombrePaciente) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("noNomina", sql.NVarChar, noNomina)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .query(`
        SELECT 
          d.claveConsulta,
          ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
          d.prioridad,
          d.observaciones,
          d.nombre_medico,
          FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion
        FROM detalleEspecialidad d
        LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
        WHERE 
          d.clave_nomina = @noNomina
          AND d.nombre_paciente = @nombrePaciente
        ORDER BY d.fecha_asignacion DESC
      `);

    const historial = result.recordset;

    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener historial de especialidades:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener historial.", error: error.message });
  }
}
