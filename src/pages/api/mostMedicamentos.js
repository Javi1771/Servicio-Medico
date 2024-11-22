// /api/mostMedicamentos.js
import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  try {
    // Conectar a la base de datos usando connectToDatabase
    const pool = await connectToDatabase();

    // Realizar la consulta en la tabla MEDICAMENTOS
    const result = await pool.request().query('SELECT * FROM MEDICAMENTOS');

    // Imprimir los resultados en la consola
    console.log('Resultados de la consulta de medicamentos:', result.recordset);

    // Enviar la respuesta al cliente
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta de medicamentos:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
