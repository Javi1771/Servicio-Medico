import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioReceta } = req.query;

  if (!folioReceta) {
    return res.status(400).json({ message: "El folioReceta es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta para obtener detalles de la receta
    const result = await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .query(`
        SELECT idDetalleReceta, folioReceta, descMedicamento, indicaciones, estatus, cantidad
        FROM detalleReceta
        WHERE folioReceta = @folioReceta
      `);

    res.status(200).json(result.recordset); // Envía los registros encontrados
  } catch (error) {
    console.error("Error en la API getDetallesReceta:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
