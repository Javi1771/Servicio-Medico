import { connectToDatabase } from "../connectToDatabase";
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveConsulta, claveEspecialidad, observaciones } = req.body;

  if (!claveConsulta || !claveEspecialidad || !observaciones) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    const estatus = 1; // Valor predeterminado de `estatus`

    // Inserción en la tabla `detalleEspecialidad`
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('claveespecialidad', sql.Int, claveEspecialidad)
      .input('observaciones', sql.Text, observaciones)
      .input('estatus', sql.Int, estatus)
      .query(`
        INSERT INTO detalleEspecialidad (claveconsulta, claveespecialidad, observaciones, estatus)
        VALUES (@claveconsulta, @claveespecialidad, @observaciones, @estatus)
      `);

    // Actualizar la columna `especialidadinterconsulta` en la tabla `consultas`
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('claveEspecialidad', sql.Int, claveEspecialidad)
      .query(`
        UPDATE consultas
        SET especialidadinterconsulta = @claveEspecialidad
        WHERE claveconsulta = @claveconsulta
      `);

    res.status(200).json({ message: 'Especialidad guardada y asignación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al guardar la especialidad:', error);
    res.status(500).json({ message: 'Error al guardar la especialidad.' });
  }
}
