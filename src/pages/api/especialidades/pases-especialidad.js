import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const query = `
        SELECT 
          c.claveconsulta AS folio,
          ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
          c.nombrepaciente AS paciente,
          FORMAT(c.fechaconsulta, 'yyyy-MM-dd HH:mm:ss') AS fecha,
          c.clavenomina AS nomina,
          CASE 
            WHEN de.estatus = 1 THEN 'EN ESPERA' 
            WHEN de.estatus = 2 THEN 'ATENDIDA' 
            ELSE 'SIN ESTATUS' 
          END AS estatus
        FROM consultas c
        LEFT JOIN detalleEspecialidad de ON c.claveconsulta = de.claveconsulta
        LEFT JOIN especialidades e ON de.claveespecialidad = e.claveespecialidad
        WHERE c.fechaconsulta >= @sevenDaysAgo
          AND de.claveespecialidad IS NOT NULL
          AND de.estatus <> 0
        ORDER BY c.claveconsulta DESC
      `;

      console.log("📄 Query ejecutado:", query);

      const result = await pool.request()
        .input("sevenDaysAgo", sql.DateTime, sevenDaysAgo)
        .query(query);

      console.log("✅ Resultado del query:", result.recordset);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener los datos:", error.message);
      res.status(500).json({ message: "Error al obtener los datos" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
