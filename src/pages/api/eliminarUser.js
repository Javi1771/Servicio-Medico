import sql from 'mssql';
import { connectToDatabase } from '../api/connectToDatabase';

// Endpoint para eliminar una especialidad por ID de la base de datos
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { id } = req.query;

  // Validar que el `id` esté presente y sea un número válido
  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) {
    console.error('Error: id debe ser un número válido.');
    return res.status(400).json({ message: 'El id debe ser un número válido' });
  }

  try {
    const pool = await connectToDatabase();

    // Realiza la eliminación utilizando el `id` en la consulta
    const result = await pool.request()
      .input('id', sql.Int, idInt)
      .query('DELETE FROM especialidades WHERE id = @id');

    // Verifica si alguna fila fue afectada (es decir, si encontró el `id`)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }

    res.status(200).json({ message: 'Especialidad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la especialidad:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
