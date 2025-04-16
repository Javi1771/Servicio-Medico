import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioPase } = req.query;

  if (!folioPase) {
    return res
      .status(400)
      .json({ message: "El folioPase es obligatorio." });
  }

  try {
    const pool = await connectToDatabase();

    if (!pool.connected) {
      console.error("Error: Pool no conectado.");
      return res
        .status(500)
        .json({ message: "No se pudo conectar a la base de datos." });
    }

    // Consulta al historial de surtimientos con estatus 2
    const query = `
      SELECT 
        FOLIO_SURTIMIENTO,
        FECHA_EMISION,
        NOMBRE_PACIENTE,
        DIAGNOSTICO
      FROM SURTIMIENTOS
      WHERE FOLIO_PASE = @folioPase 
      AND ESTADO = 1
      AND ESTATUS = 1
    `;

    const result = await pool
      .request()
      .input("folioPase", sql.Int, folioPase)
      .query(query);

    //console.log("Resultados obtenidos:", result.recordset);

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron registros para el folioPase proporcionado.",
      });
    }

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error al obtener el historial de surtimientos:",
      error.message
    );
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
}