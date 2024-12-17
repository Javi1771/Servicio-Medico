import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioPase } = req.query;

  if (!folioPase) {
    return res.status(400).json({ message: "El FOLIO_PASE es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    // Obtener el FOLIO_SURTIMIENTO más reciente
    const result = await pool
      .request()
      .input("folioPase", sql.VarChar, folioPase)
      .query(`
        SELECT [FOLIO_SURTIMIENTO]
        FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
        WHERE [FOLIO_PASE] = @folioPase
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró el FOLIO_SURTIMIENTO." });
    }

    res.status(200).json({ folioSurtimiento: result.recordset[0].FOLIO_SURTIMIENTO });
  } catch (error) {
    console.error("Error al obtener FOLIO_SURTIMIMIENTO:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
