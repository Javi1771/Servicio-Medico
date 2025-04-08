// pages/api/farmacia/topMedicamentos.js
import { connectToDatabase } from '../../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Falta el parámetro "date" en formato YYYY-MM-DD' });
  }

  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    // Aumentamos el timeout a 60000 ms (60 segundos)
    request.timeout = 60000;
    // Pasamos el parámetro de fecha como DATETIME
    request.input('startDate', sql.DateTime, new Date(date));

    const query = `
      SELECT TOP 20
        ds.claveMedicamento,
        COUNT(*) AS total,
        m.medicamento AS nombreMedicamento
      FROM detalleSurtimientos ds
      LEFT JOIN MEDICAMENTOS m ON ds.claveMedicamento = m.claveMedicamento
      WHERE ds.folioSurtimiento IN (
        SELECT FOLIO_SURTIMIENTO 
        FROM SURTIMIENTOS
        WHERE FECHA_EMISION BETWEEN @startDate AND GETDATE()
      )
      GROUP BY ds.claveMedicamento, m.medicamento
      ORDER BY total DESC
      OPTION (RECOMPILE)
    `;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener top medicamentos:", error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
}
