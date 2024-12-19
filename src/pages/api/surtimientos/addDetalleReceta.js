import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioReceta, descMedicamento, indicaciones, cantidad } = req.body;

  if (!folioReceta || !descMedicamento || !indicaciones || !cantidad) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const pool = await connectToDatabase();

    const query = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleReceta] 
        (folioReceta, descMedicamento, indicaciones, estatus, cantidad)
      VALUES (@folioReceta, @descMedicamento, @indicaciones, 1, @cantidad)
    `;

    await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .input("descMedicamento", sql.NVarChar(80), descMedicamento)
      .input("indicaciones", sql.NVarChar(sql.MAX), indicaciones)
      .input("cantidad", sql.NVarChar(50), cantidad)
      .query(query);

    res.status(200).json({ message: "Registro guardado correctamente." });
  } catch (error) {
    console.error("Error al insertar en detalleReceta:", error);
    res.status(500).json({ message: "Error al insertar en la base de datos." });
  }
}
    