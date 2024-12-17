import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveMedicamento } = req.query;

  if (!claveMedicamento) {
    return res.status(400).json({ message: "La clave del medicamento es requerida." });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta a la tabla MEDICAMENTOS
    const query = `
      SELECT MEDICAMENTO
      FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS]
      WHERE CLAVEMEDICAMENTO = @claveMedicamento
    `;

    const result = await pool
      .request()
      .input("claveMedicamento", sql.Int, claveMedicamento)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Medicamento no encontrado." });
    }

    res.status(200).json({ medicamento: result.recordset[0].MEDICAMENTO });
  } catch (error) {
    console.error("Error al obtener el medicamento:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
