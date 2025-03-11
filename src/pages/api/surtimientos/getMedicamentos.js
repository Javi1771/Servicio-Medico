import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();

      const query = `
        SELECT 
          claveMedicamento AS CLAVEMEDICAMENTO, 
          medicamento AS MEDICAMENTO 
        FROM MEDICAMENTOS
        WHERE CLAVEMEDICAMENTO > 0
      `;

      const result = await pool.request().query(query);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "No se encontraron medicamentos." });
      }

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener medicamentos:", error);
      res.status(500).json({ message: "Error al obtener medicamentos." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
