import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  const { claveMedicamento } = req.query;

  if (!claveMedicamento) {
    return res.status(400).json({ message: "La clave del medicamento es requerida." });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT medicamento AS MEDICAMENTO
      FROM MEDICAMENTOS
      WHERE claveMedicamento = @claveMedicamento
    `;
    const result = await pool
      .request()
      .input("claveMedicamento", sql.VarChar, claveMedicamento)
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
