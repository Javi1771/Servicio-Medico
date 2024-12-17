import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.query;

  if (!folio) {
    return res.status(400).json({ message: "El folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT idDetalleReceta, folioReceta, descMedicamento, indicaciones, cantidad, estatus
      FROM detalleReceta
      WHERE folioReceta = @folio
    `;

    const result = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(query);

    res.status(200).json(result.recordset); // Enviar datos obtenidos
  } catch (error) {
    console.error("Error en la API:", error.message);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
}
