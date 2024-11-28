import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();
    const query = 'SELECT id_enf_cronica, cronica FROM CRONICAS';
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener enfermedades crónicas:", error);
    res.status(500).json({ message: 'Error al obtener enfermedades crónicas', error });
  }
}
