import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    //* Actualiza la columna ESTATUS a 0 en SURTIMIENTOS para el folio dado
    await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`UPDATE SURTIMIENTOS SET ESTATUS = 0 WHERE FOLIO_PASE = @folio`);

    return res.status(200).json({ message: "Surtimiento cancelado correctamente." });
  } catch (error) {
    console.error("Error al cancelar surtimiento:", error);
    return res.status(500).json({
      message: "Error al cancelar el surtimiento",
      error: error.message,
    });
  }
}
