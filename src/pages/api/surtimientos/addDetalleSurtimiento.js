import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioSurtimiento, claveMedicamento, indicaciones, cantidad, estatus } = req.body;

  // Validar que todos los campos sean proporcionados
  if (!folioSurtimiento || !claveMedicamento || !indicaciones || !cantidad || estatus === undefined) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const pool = await connectToDatabase();

    const query = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleSurtimientos] 
        (folioSurtimiento, claveMedicamento, indicaciones, cantidad, estatus)
      VALUES (@folioSurtimiento, @claveMedicamento, @indicaciones, @cantidad, @estatus)
    `;

    await pool
      .request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .input("claveMedicamento", sql.NVarChar(15), claveMedicamento) // Asegúrate de que el tamaño sea correcto
      .input("indicaciones", sql.NVarChar(sql.MAX), indicaciones)
      .input("cantidad", sql.NVarChar(50), cantidad)
      .input("estatus", sql.Int, estatus)
      .query(query);

    res.status(200).json({ message: "Registro guardado correctamente." });
  } catch (error) {
    console.error("Error al insertar en detalleSurtimientos:", error);
    res.status(500).json({ message: "Error al insertar en la base de datos." });
  }
}