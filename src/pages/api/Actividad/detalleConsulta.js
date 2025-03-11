import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clave } = req.query;
  if (!clave) {
    return res
      .status(400)
      .json({ message: "Falta el parámetro 'clave' en la URL." });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("clave", sql.VarChar, clave)
      .query(`
        SELECT
          nombrepaciente,
          edad,
          motivoconsulta,
          diagnostico,
          clavenomina
        FROM consultas
        WHERE claveconsulta = @clave
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró información para la clave proporcionada" });
    }

    const detalle = result.recordset[0];
    return res.status(200).json(detalle);
  } catch (error) {
    console.error("Error al obtener detalle de la consulta:", error);
    return res.status(500).json({
      message: "Error interno al obtener detalle de la consulta",
      error: error.message,
    });
  }
}
