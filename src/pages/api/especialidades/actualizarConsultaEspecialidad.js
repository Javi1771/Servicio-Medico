import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveConsulta, seasignoaespecialidad } = req.body;

  if (!claveConsulta || !seasignoaespecialidad) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    //* Actualizar `seasignoaespecialidad` en la tabla `consultas`
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('seasignoaespecialidad', sql.VarChar, seasignoaespecialidad)
      .query(`
        UPDATE consultas
        SET seasignoaespecialidad = @seasignoaespecialidad
        WHERE claveconsulta = @claveconsulta
      `);

    res.status(200).json({ message: 'Estado de asignación a especialidad actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el estado de asignación:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de asignación.' });
  }
}
