import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();
      const query = `
        SELECT ean, sustancia, piezas 
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS_FARMACIA] 
        WHERE piezas > 0 AND activo = 1
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
