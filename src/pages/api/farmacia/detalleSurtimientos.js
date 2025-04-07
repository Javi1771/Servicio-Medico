// pages/api/farmacia/detalleSurtimientos.js
import { connectToDatabase } from '../../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // Se espera recibir ?id=<FOLIO_SURTIMIENTO>
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'Falta el parámetro id' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT 
          ds.[idSurtimiento],
          ds.[folioSurtimiento],
          ds.[claveMedicamento],
          ds.[indicaciones],
          ds.[cantidad],
          ds.[estatus],
          ds.[piezas],
          ds.[entregado],
          m.[medicamento] AS nombreMedicamento
        FROM [detalleSurtimientos] ds
        LEFT JOIN [MEDICAMENTOS] m ON ds.[claveMedicamento] = m.[claveMedicamento]
        WHERE ds.[folioSurtimiento] = @id AND ds.[estatus] = 1
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener detalle de surtimientos:", error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
}
