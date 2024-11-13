// /pages/api/clasificaciones.js
import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM TIPO_MEDICAMENTO');
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'No se encontraron clasificaciones de medicamentos' });
    }

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener las clasificaciones de medicamentos:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}