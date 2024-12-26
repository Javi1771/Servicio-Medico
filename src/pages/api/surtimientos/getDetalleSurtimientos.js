import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { folioSurtimiento } = req.query;

    if (!folioSurtimiento) {
      return res.status(400).json({ success: false, message: "Folio Surtimiento es requerido" });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        SELECT 
          idSurtimiento,
          folioSurtimiento,
          claveMedicamento,
          indicaciones,
          cantidad
        FROM detalleSurtimientos
        WHERE folioSurtimiento = @folioSurtimiento
      `;
      const result = await pool.request()
        .input('folioSurtimiento', sql.VarChar, folioSurtimiento)
        .query(query);

      res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("Error al obtener los detalles de surtimientos:", error.message);
      res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  } else {
    res.status(405).json({ success: false, message: "Método no permitido" });
  }
}