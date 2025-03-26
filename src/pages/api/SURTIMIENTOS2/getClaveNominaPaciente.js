import { connectToDatabase } from "../../api/connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  // Se espera que se envíe el parámetro 'folio' (que corresponde al FOLIO_PASE)
  const { folio } = req.query;
  if (!folio) {
    return res.status(400).json({ message: "Falta el parámetro folio" });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("folio", sql.Int, parseInt(folio, 10))
      .query(`
        SELECT NOMINA, CLAVE_PACIENTE
        FROM SURTIMIENTOS
        WHERE FOLIO_PASE = @folio
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró el surtimiento con el folio proporcionado" });
    }

    return res.status(200).json({ ok: true, data: result.recordset[0] });
  } catch (error) {
    console.error("Error al obtener clave nomina y clave paciente:", error);
    return res.status(500).json({ message: "Error al obtener datos", error: error.message });
  }
}
