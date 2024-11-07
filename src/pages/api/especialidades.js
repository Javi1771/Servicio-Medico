import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();

    const result = await pool.request().query('SELECT * FROM especialidades'); 

    console.log('Resultados de la consulta:', result.recordset);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
