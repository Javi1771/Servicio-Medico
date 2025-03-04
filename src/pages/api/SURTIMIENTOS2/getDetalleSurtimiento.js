// pages/api/SURTIMIENTOS2/getDetalleSurtimiento.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Método no permitido" });
    }

    const { folioSurtimiento } = req.body;
    if (!folioSurtimiento) {
      return res.status(400).json({ message: "FolioSurtimiento es requerido" });
    }

    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .query(`
        SELECT
          ds.idSurtimiento,
          ds.folioSurtimiento,
          ds.claveMedicamento,
          m.medicamento AS NOMBRE_MEDICAMENTO,
          ds.indicaciones,
          ds.cantidad,
          ds.estatus,
          ds.piezas,
          ds.entregado
        FROM detalleSurtimientos ds
        LEFT JOIN MEDICAMENTOS m ON ds.claveMedicamento = m.claveMedicamento
        WHERE ds.folioSurtimiento = @folioSurtimiento
      `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error en getDetalleSurtimiento:", error);
    return res.status(500).json({ message: error.message });
  }
}
