import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavePaciente } = req.query;

  if (!clavePaciente) {
    return res.status(400).json({ message: "La clave del paciente es obligatoria." });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT [F_NACIMIENTO]
      FROM BENEFICIARIO
      WHERE NO_NOMINA = @clavePaciente
    `;

    const result = await pool
      .request()
      .input("clavePaciente", sql.NVarChar, clavePaciente)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Beneficiario no encontrado." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener el beneficiario:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}