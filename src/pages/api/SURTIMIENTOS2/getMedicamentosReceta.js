import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(`
        SELECT
          dr.idDetalleReceta,
          dr.folioReceta,
          dr.indicaciones,
          dr.cantidad,
          m.medicamento AS nombreMedicamento,
          m.claveMedicamento AS claveMedicamento
        FROM [PRESIDENCIA].[dbo].[detalleReceta] AS dr
        JOIN [PRESIDENCIA].[dbo].[MEDICAMENTOS_NEW] AS m
          ON dr.descMedicamento = m.claveMedicamento
        WHERE dr.folioReceta = @folio
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener medicamentos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
