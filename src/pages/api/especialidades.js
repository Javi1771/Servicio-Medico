import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase(); // Conectar a la base de datos

    const result = await pool.request().query('SELECT * FROM especialidades'); // Consulta a la tabla especialidades

    // Imprimir los resultados en la consola
    console.log('Resultados de la consulta:', result.recordset);

    // Enviar la respuesta al cliente
    res.status(200).json(result.recordset); // Devolver el conjunto de registros
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
