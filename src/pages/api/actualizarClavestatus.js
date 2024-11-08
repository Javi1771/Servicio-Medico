/* eslint-disable @typescript-eslint/no-unused-vars */
import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveConsulta, clavestatus } = req.body;

  if (!claveConsulta || !clavestatus) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    // Actualiza el campo `clavestatus` en la tabla `consultas`
    const result = await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('clavestatus', sql.Int, clavestatus)
      .query(`
        UPDATE consultas
        SET clavestatus = @clavestatus
        WHERE claveconsulta = @claveconsulta
      `);

    res.status(200).json({ message: 'Clave de estatus actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar clave de estatus:', error);
    res.status(500).json({ message: 'Error al actualizar clave de estatus.' });
  }
}
