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

    const currentMonth = new Date().getMonth() + 1; // Mes actual
    const currentYear = new Date().getFullYear(); // Año actual

    const result = await pool
      .request()
      .input("noNomina", sql.NVarChar, noNomina)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .input("currentMonth", sql.Int, currentMonth)
      .input("currentYear", sql.Int, currentYear)
      .query(`
        SELECT 
          d.claveConsulta,
          e.especialidad,
          d.prioridad,
          d.observaciones,
          FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'dd/MM/yyyy') AS fecha_asignacion -- Ajuste a zona horaria local
        FROM detalleEspecialidad d
        JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
        WHERE 
          d.clave_nomina = @noNomina
          AND d.nombre_paciente = @nombrePaciente
          AND MONTH(d.fecha_asignacion) = @currentMonth
          AND YEAR(d.fecha_asignacion) = @currentYear
        ORDER BY d.claveConsulta DESC
      `);

    res.status(200).json({ historial: result.recordset });
  } catch (error) {
    console.error("Error al obtener historial de especialidades:", error);
    res.status(500).json({ message: "Error al obtener historial de especialidades." });
  }
}
