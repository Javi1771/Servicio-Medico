import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  try {
    // Conectar a la base de datos utilizando tu función
    const pool = await connectToDatabase(); // Asegúrate de que esta función devuelva el pool correcto

    // Realizar la consulta
    const result = await pool.request().query('SELECT * FROM tiposusuarios'); // Cambia 'tiposusuarios' por el nombre de tu tabla si es necesario
    // Imprimir los resultados en la consola
    console.log('Resultados de la consulta:', result.recordset);

    // Enviar la respuesta al cliente
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  } finally {
    // Cerrar la conexión
    await sql.close();
  }
}
