import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const pool = await connectToDatabase();

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    //* Ajusta la consulta SQL para obtener registros del día actual y con clavestatus = 1
    const result = await pool.request()
      .input('startOfDay', sql.DateTime, startOfDay)
      .input('endOfDay', sql.DateTime, endOfDay)
      .query(`
        SELECT 
          consultas.*, 
          P.PARENTESCO AS parentesco_desc 
        FROM consultas
        LEFT JOIN PARENTESCO P ON consultas.parentesco = P.ID_PARENTESCO
        WHERE consultas.clavestatus = 1 
          AND consultas.fechaconsulta BETWEEN @startOfDay AND @endOfDay
      `);

    res.status(200).json({ consultas: result.recordset });
    console.log('Número de consultas obtenidas:', result.recordset.length);
  } catch (error) {
    console.error('Error al cargar consultas del día:', error);
    res.status(500).json({ message: 'Error al cargar consultas del día' });
  }
}
