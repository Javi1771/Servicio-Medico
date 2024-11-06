import { connectToDatabase } from '../api/connectToDatabase';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function queryWithRetries(pool, query, retries = MAX_RETRIES) {
  try {
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    if (retries > 1) {
      console.warn(`Consulta fallida. Reintentando en ${RETRY_DELAY_MS / 1000} segundos...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return queryWithRetries(pool, query, retries - 1);
    } else {
      throw error;
    }
  }
}

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();
    const result = await queryWithRetries(pool, 'SELECT * FROM especialidades');
    
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron resultados en la tabla especialidades' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al realizar la consulta de especialidades:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
