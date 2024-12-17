import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioSurtimiento } = req.query;

  if (!folioSurtimiento) {
    return res.status(400).json({ message: "El FOLIO_SURTIMIENTO es requerido" });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .query(`
        SELECT idSurtimiento, claveMedicamento, indicaciones, cantidad, estatus
        FROM [PRESIDENCIA].[dbo].[detalleSurtimientos]
        WHERE folioSurtimiento = @folioSurtimiento
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error en getDetallesSurtimiento:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
