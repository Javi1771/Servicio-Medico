import { connectToDatabase } from '../connectToDatabase';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function queryWithRetries(pool, query, retries = MAX_RETRIES) {
  try {
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    if (error.code === 'ECONNCLOSED' && retries > 1) {
      console.warn(
        `Conexión cerrada. Reintentando en ${RETRY_DELAY_MS/1000}s...`
      );
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      const newPool = await connectToDatabase();
      return queryWithRetries(newPool, query, retries - 1);
    } else if (retries > 1) {
      console.warn(
        `Consulta fallida. Reintentando en ${RETRY_DELAY_MS/1000}s...`
      );
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return queryWithRetries(pool, query, retries - 1);
    } else {
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Use POST.' });
  }

  const { claveEspecialidad } = req.body;
  if (!claveEspecialidad || isNaN(Number(claveEspecialidad))) {
    return res.status(400).json({
      success: false,
      message: 'La claveEspecialidad debe ser un número válido.',
    });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT claveproveedor, nombreproveedor
      FROM proveedores
      WHERE activo = 'S'
        AND (
          claveespecialidad = ${claveEspecialidad}
          OR claveproveedor = 610
        )
      ORDER BY
        CASE WHEN claveproveedor = 610 THEN 0 ELSE 1 END,
        nombreproveedor ASC;
    `;

    const proveedores = await queryWithRetries(pool, query);
    if (!proveedores.length) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron proveedores para la especialidad proporcionada.',
      });
    }

    return res.status(200).json({ success: true, data: proveedores });
  } catch (error) {
    console.error('Error al consultar proveedores:', error);
    return res.status(500).json({ success: false, message: 'Error al realizar la consulta.', error: error.message });
  }
}
