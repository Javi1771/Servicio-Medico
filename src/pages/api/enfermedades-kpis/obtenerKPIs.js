import { connectToDatabase } from "../connectToDatabase";
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { id_enf_cronica } = req.query;

  if (!id_enf_cronica) {
    return res.status(400).json({ message: "El ID de enfermedad crónica es obligatorio" });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT id_kpi, kpi
      FROM KPIs
      WHERE id_enf_cronica = @id_enf_cronica AND estatus = 1
    `;

    const result = await pool.request()
      .input("id_enf_cronica", sql.Int, id_enf_cronica)
      .query(query);

    const data = result.recordset;

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No se encontraron KPIs para esta enfermedad crónica" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener los KPIs:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
