import sql from 'mssql';
import { connectToDatabase } from '../api/connectToDatabase';

// Endpoint para eliminar una especialidad por claveespecialidad
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveespecialidad } = req.query;

  // Validar que `claveespecialidad` esté presente y sea un número válido
  const claveEspecialidadInt = parseInt(claveespecialidad, 10);
  if (isNaN(claveEspecialidadInt)) {
    console.error('Error: claveespecialidad debe ser un número válido.');
    return res.status(400).json({ message: 'La claveespecialidad debe ser un número válido' });
  }

  try {
    const pool = await connectToDatabase();

    // Realiza la eliminación utilizando `claveespecialidad` en la consulta
    const result = await pool.request()
      .input('claveespecialidad', sql.Int, claveEspecialidadInt)
      .query('DELETE FROM especialidades WHERE claveespecialidad = @claveespecialidad');

    // Verifica si alguna fila fue afectada (es decir, si encontró el `claveespecialidad`)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    res.status(200).json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la especialidad:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
