import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { nombre } = req.body;
  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({ error: "Nombre de estudio inválido" });
  }

  try {
    const pool = await connectToDatabase();

    //? 1) Obtener el último ID existente
    const maxResult = await pool
      .request()
      .query("SELECT MAX(claveEstudio) AS maxId FROM ESTUDIOS");
    const maxId = maxResult.recordset[0].maxId || 0;
    const newId = maxId + 1;

    //? 2) Insertar el nuevo estudio
    await pool
      .request()
      .input("id", sql.Int, newId)
      .input("estudio", sql.NVarChar(255), nombre.trim())
      .input("estatus", sql.Int, 1)
      .query(`
        INSERT INTO ESTUDIOS (claveEstudio, estudio, estatus)
        VALUES (@id, @estudio, @estatus)
      `);

    //? 3) Responder con éxito
    return res.status(200).json({
      success: true,
      claveEstudio: newId,
      mensaje: "Estudio guardado correctamente"
    });

  } catch (error) {
    console.error("Error en guardarEstudios:", error);
    return res.status(500).json({
      error: "Error al guardar el estudio",
      details: error.message
    });
  }
}
