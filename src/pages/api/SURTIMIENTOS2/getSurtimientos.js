// pages/api/SURTIMIENTOS2/getSurtimientos.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Método no permitido" });
    }

    const { folioPase } = req.body;
    if (!folioPase) {
      return res.status(400).json({ message: "FolioPase es requerido" });
    }

    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("folioPase", sql.Int, folioPase)
      .query(`
        SELECT TOP 20
          s.FOLIO_SURTIMIENTO,
          s.FOLIO_PASE,
          s.FECHA_EMISION,
          s.NOMBRE_PACIENTE,
          s.DIAGNOSTICO,
          s.CLAVEMEDICO,
          p.nombreproveedor AS NOMBRE_PROVEEDOR
        FROM SURTIMIENTOS s
        LEFT JOIN proveedores p ON s.CLAVEMEDICO = p.CLAVEPROVEEDOR
        WHERE s.FOLIO_PASE = @folioPase
        ORDER BY s.FECHA_EMISION DESC
      `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error en getSurtimientos:", error);
    return res.status(500).json({ message: error.message });
  }
}
