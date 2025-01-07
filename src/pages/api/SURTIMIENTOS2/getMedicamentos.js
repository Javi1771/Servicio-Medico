import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.query(`
      SELECT CLAVEMEDICAMENTO, MEDICAMENTO 
      FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS] 
      WHERE ESTATUS = 1
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al cargar los medicamentos:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
