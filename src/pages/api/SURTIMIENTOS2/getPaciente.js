import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;

  if (!folio) {
    return res.status(400).json({ message: "El folio es requerido." });
  }

  try {
    // Conexión a la base de datos
    const pool = await connectToDatabase();
    console.log("Conectado a la base de datos. Buscando información del paciente...");

    // Consulta SQL para obtener la información del paciente
    const result = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(`
        SELECT nombrepaciente, edad, departamento, parentesco
        FROM [PRESIDENCIA].[dbo].[consultas]
        WHERE claveconsulta = @folio
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró información del paciente para el folio proporcionado." });
    }

    const paciente = result.recordset[0];
    console.log("Información del paciente encontrada:", paciente);

    return res.status(200).json(paciente);
  } catch (error) {
    console.error("Error al obtener datos del paciente:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
