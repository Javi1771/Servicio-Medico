import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { clavenomina } = req.query;

  try {
    const pool = await connectToDatabase();
    const result = await pool.request()
      .input('clavenomina', sql.NVarChar(sql.MAX), clavenomina)
      .query(`
        SELECT id_antecedente, descripcion, clavenomina, nombre_paciente, tipo_antecedente, fecha_registro, fecha_inicio_enfermedad
        FROM antecedentes_clinicos
        WHERE clavenomina = @clavenomina
      `);

    console.log('Datos enviados desde la API:', result.recordset);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener antecedentes:', error);
    res.status(500).json({ message: 'Error al obtener antecedentes.', error });
  }
}
