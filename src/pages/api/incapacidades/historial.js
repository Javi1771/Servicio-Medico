import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { noNomina, nombrePaciente } = req.query;

  if (!noNomina || !nombrePaciente) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("noNomina", sql.NVarChar, noNomina)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .query(`
        SELECT claveConsulta, diagnostico, fechaInicial, fechaFinal
        FROM detalleIncapacidad
        WHERE noNomina = @noNomina AND nombrePaciente = @nombrePaciente
      `);

    res.status(200).json({ historial: result.recordset });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial." });
  }
}
