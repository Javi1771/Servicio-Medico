import { connectToDatabase } from '../connectToDatabase';
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta para obtener las especialidades
    const result = await pool
      .request()
      .query('SELECT claveespecialidad, especialidad FROM especialidades WHERE estatus = 1');

    res.status(200).json(result.recordset); // Enviar las especialidades
  } catch (error) {
    console.error('Error al obtener las especialidades:', error);
    res.status(500).json({ message: 'Error al obtener las especialidades' });
  }
}