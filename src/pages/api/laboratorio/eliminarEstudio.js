import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const pool = await connectToDatabase();

    // En lugar de borrar, marcamos estatus = 0 (soft delete)
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("estatus", sql.Int, 0)
      .query(`
        UPDATE ESTUDIOS
        SET estatus = @estatus
        WHERE claveEstudio = @id
      `);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error en eliminarEstudio:", error);
    return res.status(500).json({ error: error.message });
  }
}
