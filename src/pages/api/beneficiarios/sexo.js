// pages/api/getAllSexos.js
import { connectToDatabase } from '../connectToDatabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query('SELECT idSexo, sexo FROM SEXO');
      
      res.status(200).json(result.recordset); // Devuelve todos los sexos
    } catch (error) {
      console.error('Error al obtener los sexos:', error);
      res.status(500).json({ error: 'Error al obtener los sexos' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
