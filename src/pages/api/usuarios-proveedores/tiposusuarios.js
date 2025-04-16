import { connectToDatabase } from '../connectToDatabase';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function queryWithRetries(pool, query, retries = MAX_RETRIES) {
  try {
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    if (error.code === 'ECONNCLOSED' && retries > 1) {
      console.warn(`Conexión cerrada. Intentando reconectar y reintentar la consulta en ${RETRY_DELAY_MS / 1000} segundos...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      const newPool = await connectToDatabase();
      return queryWithRetries(newPool, query, retries - 1);
    } else if (retries > 1) {
      console.warn(`Consulta fallida. Reintentando en ${RETRY_DELAY_MS / 1000} segundos...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return queryWithRetries(pool, query, retries - 1);
    } else {
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const result = await queryWithRetries(pool, 'SELECT * FROM tiposusuarios');

    if (!result || result.length === 0) {
      //console.log('No se encontraron resultados en la tabla tiposusuarios');
      return res.status(404).json({ message: 'No se encontraron resultados en la tabla tiposusuarios' });
    }

    //console.log('Resultados de la consulta:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  } finally {
    if (pool) {
      try {
        await pool.close();
        //console.log("Conexión cerrada correctamente.");
      } catch (closeError) {
        console.error("Error al cerrar la conexión:", closeError);
      }
    }
  }
}
