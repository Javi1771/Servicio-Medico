import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { id, nombre } = req.body;
  if (!id || !nombre || typeof nombre !== "string") {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  try {
    const pool = await connectToDatabase();
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("nombre", sql.NVarChar(255), nombre.trim())
      .query(
        `UPDATE ESTUDIOS
         SET estudio = @nombre
         WHERE claveEstudio = @id`
      );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error editarEstudio:", error);
    return res.status(500).json({ error: error.message });
  }
}
