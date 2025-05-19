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
      const newPool = await connectToDatabase(); //! Intentar reconectar
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
  try {
    const pool = await connectToDatabase();

    //* Consulta modificada para incluir el orden alfabético por el campo 'especialidad'
    const query = `
      SELECT * 
      FROM especialidades 
      WHERE estatus = 1 
      ORDER BY especialidad ASC
    `;

    const result = await queryWithRetries(pool, query);

    //console.log('Resultados de la consulta:', result);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al realizar la consulta de especialidades:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
