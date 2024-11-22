import sql from 'mssql';
import { connectToDatabase } from './connectToDatabase';

// Endpoint para eliminar una especialidad por nombre
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { especialidad } = req.query;

  // Validar que `especialidad` esté presente
  if (!especialidad) {
    console.error('Error: El nombre de la especialidad debe ser proporcionado.');
    return res.status(400).json({ message: 'El nombre de la especialidad es requerido' });
  }

  try {
    const pool = await connectToDatabase();

    // Realiza la eliminación utilizando el nombre `especialidad` en la consulta
    const result = await pool.request()
      .input('especialidad', sql.VarChar, especialidad)
      .query('DELETE FROM especialidades WHERE especialidad = @especialidad');

    // Verifica si alguna fila fue afectada (es decir, si encontró la `especialidad`)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    res.status(200).json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la especialidad:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
