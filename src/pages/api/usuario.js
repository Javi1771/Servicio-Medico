// /api/usuarios.js
import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  try {
    // Conectar a la base de datos usando connectToDatabase
    const pool = await connectToDatabase();

    // Realizar la consulta
    const result = await pool.request().query('SELECT * FROM USUARIOS'); // Cambia 'USUARIOS' por el nombre de tu tabla si es necesario

    // Imprimir los resultados en la consola
    console.log('Resultados de la consulta:', result.recordset);

    // Enviar la respuesta al cliente
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
