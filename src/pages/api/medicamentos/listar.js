import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();
      const query = `
        SELECT CLAVEMEDICAMENTO, MEDICAMENTO
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS]
        WHERE ESTATUS = 1
        ORDER BY MEDICAMENTO ASC
      `;
      const result = await pool.request().query(query);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener medicamentos:", error);
      res.status(500).json({ error: "Error al obtener medicamentos" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
