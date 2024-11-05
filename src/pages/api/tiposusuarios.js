import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM tiposusuarios'); // Cambia 'tiposusuarios' por el nombre correcto de tu tabla

    console.log('Resultados de la consulta:', result.recordset);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
