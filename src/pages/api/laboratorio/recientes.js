import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();

    const query = `
    SELECT
      NOMBRE_PACIENTE,
      EDAD,
      CLAVECONSULTA,
      NOMINA,
      DEPARTAMENTO
    FROM LABORATORIOS
    WHERE ESTATUS = 1
    ORDER BY FECHA_EMISION DESC;
  `;

    const result = await db.query(query);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error in /api/laboratorio/recientes: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
