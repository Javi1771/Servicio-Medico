import { connectToDatabase } from '../api/connectToDatabase';
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const result = await queryWithRetries(pool, 'SELECT * FROM tiposusuarios');

    if (!result || result.length === 0) {
      console.log('No se encontraron resultados en la tabla tiposusuarios');
      return res.status(404).json({ message: 'No se encontraron resultados en la tabla tiposusuarios' });
    }

    console.log('Resultados de la consulta:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  } finally {
    if (pool) {
      try {
        await pool.close(); // Cierra la conexión después de la consulta
        console.log("Conexión cerrada correctamente.");
      } catch (closeError) {
        console.error("Error al cerrar la conexión:", closeError);
      }
    }
  }
}
