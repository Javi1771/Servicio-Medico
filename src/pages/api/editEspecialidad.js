import sql from 'mssql';
import { connectToDatabase } from './connectToDatabase';

// Endpoint para editar una especialidad
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveespecialidad, especialidad, especial, estatus } = req.body;

  // Validación de datos
  if (!claveespecialidad || !especialidad || !especial) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const pool = await connectToDatabase();

    // Preparar la consulta de actualización
    const request = pool.request()
      .input('claveespecialidad', sql.Int, claveespecialidad)
      .input('especialidad', sql.VarChar, especialidad)
      .input('especial', sql.VarChar, especial)
      .input('estatus', sql.Bit, estatus);

    const query = `
      UPDATE especialidades
      SET 
        especialidad = @especialidad,
        especial = @especial,
        estatus = @estatus
      WHERE claveespecialidad = @claveespecialidad
    `;

    // Ejecutar la consulta
    await request.query(query);

    res.status(200).json({ message: 'Especialidad actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la especialidad:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
