/* eslint-disable @typescript-eslint/no-unused-vars */
// proveedores.js

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
        `Conexión cerrada. Intentando reconectar y reintentar la consulta en ${
          RETRY_DELAY_MS / 1000
        } segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      const newPool = await connectToDatabase(); //* Intentar reconectar
      return queryWithRetries(newPool, query, retries - 1);
    } else if (retries > 1) {
      console.warn(
        `Consulta fallida. Reintentando en ${
          RETRY_DELAY_MS / 1000
        } segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return queryWithRetries(pool, query, retries - 1);
    } else {
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método no permitido. Use POST.' });
    return;
  }

  try {
    const { claveEspecialidad } = req.body;

    //* Validar que claveEspecialidad sea un número
    if (!claveEspecialidad || isNaN(Number(claveEspecialidad))) {
      res.status(400).json({
        message: 'La claveEspecialidad debe ser un número válido.',
      });
      return;
    }

    const pool = await connectToDatabase();

    //* Consulta para obtener los proveedores según la clave de especialidad
    const query = `
      SELECT 
        claveproveedor, 
        nombreproveedor 
      FROM 
        proveedores 
      WHERE 
        claveespecialidad = ${claveEspecialidad} AND
        activo = 'S'
        ORDER BY nombreproveedor ASC;`

    const result = await queryWithRetries(pool, query);

    if (result.length === 0) {
      res.status(404).json({
        message: 'No se encontraron proveedores para la especialidad proporcionada.',
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al realizar la consulta de proveedores:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
