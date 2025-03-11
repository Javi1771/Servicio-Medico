import { connectToDatabase } from "../../api/connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveEspecialidad } = req.query;

  if (!claveEspecialidad) {
    return res.status(400).json({ message: "La clave de especialidad es obligatoria." });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT especialidad
      FROM especialidades
      WHERE claveespecialidad = @claveEspecialidad
    `;

    const result = await pool
      .request()
      .input("claveEspecialidad", sql.Int, claveEspecialidad)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Especialidad no encontrada." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener la especialidad:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
