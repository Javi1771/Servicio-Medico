import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveConsulta, seasignoaespecialidad, claveEspecialidad, observaciones } = req.body;

  if (!claveConsulta || !seasignoaespecialidad || !claveEspecialidad) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    // Actualizar la columna `seasignoaespecialidad` y `especialidadinterconsulta` en la tabla `consultas`
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('seasignoaespecialidad', sql.VarChar, seasignoaespecialidad)
      .input('claveEspecialidad', sql.Int, claveEspecialidad)
      .query(`
        UPDATE consultas
        SET seasignoaespecialidad = @seasignoaespecialidad,
            especialidadinterconsulta = @claveEspecialidad
        WHERE claveconsulta = @claveconsulta
      `);

    // Insertar en la tabla `detalleespecialidad`
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('claveEspecialidad', sql.Int, claveEspecialidad)
      .input('observaciones', sql.VarChar, observaciones)
      .query(`
        INSERT INTO detalleespecialidad (claveconsulta, claveespecialidad, observaciones)
        VALUES (@claveconsulta, @claveEspecialidad, @observaciones)
      `);

    res.status(200).json({ message: 'Consulta y detalles de especialidad actualizados correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la consulta:', error);
    res.status(500).json({ message: 'Error al actualizar la consulta.' });
  }
}
