import sql from 'mssql';
import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveespecialidad } = req.body;

  // Log para verificar el valor recibido
  console.log('Valor recibido para claveespecialidad:', claveespecialidad);

  // Validación de datos
  if (!claveespecialidad || isNaN(claveespecialidad)) {
    console.error('Error: claveespecialidad debe ser un número válido.');
    return res.status(400).json({ message: 'Clave de especialidad debe ser un número válido' });
  }

  try {
    const pool = await connectToDatabase();

    console.log(`Ejecutando UPDATE para desactivar claveespecialidad: ${claveespecialidad}`);

    await pool
      .request()
      .input('claveespecialidad', sql.Int, claveespecialidad) // Asegúrate de que sea un número
      .query(`
        UPDATE especialidades
        SET estatus = 0
        WHERE claveespecialidad = @claveespecialidad
      `);

    res.status(200).json({ message: 'Especialidad desactivada correctamente' });
  } catch (error) {
    console.error('Error al desactivar la especialidad:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
