import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { medida } = req.body;

    //* Verificamos que se envíe el campo "medida"
    if (!medida) {
      return res.status(400).json({ message: "El campo 'medida' es obligatorio." });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        INSERT INTO [dbo].[unidades_de_medida] (medida)
        VALUES (@medida)
      `;
      await pool.request()
        .input("medida", sql.NVarChar, medida)
        .query(query);

      res.status(201).json({ message: "Unidad de medida insertada correctamente." });
    } catch (error) {
      console.error("Error en /api/farmacia/unidades/insert:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
