// pages/api/medicamentos.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Conexión a la base de datos
      const pool = await connectToDatabase();

      // Consulta SQL para obtener los medicamentos
      const query = `
        SELECT 
          MEDICAMENTO 
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS] 
        WHERE CLAVEMEDICAMENTO > 0
      `;

      const result = await pool.request().query(query);

      // Retornar los medicamentos en formato JSON
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener medicamentos:", error);
      res
        .status(500)
        .json({ message: "Ocurrió un error al obtener los medicamentos." });
    }
  } else {
    // Método no permitido
    res.status(405).json({ message: "Método no permitido" });
  }
}
