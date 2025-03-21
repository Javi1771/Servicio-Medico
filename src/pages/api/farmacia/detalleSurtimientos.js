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
          d.[idSurtimiento],
          d.[folioSurtimiento],
          d.[claveMedicamento],
          m.[medicamento] AS medicamentoNombre,  -- Se obtiene el nombre del medicamento desde la tabla MEDICAMENTOS
          d.[indicaciones],
          d.[cantidad],
          d.[estatus],
          d.[piezas],
          d.[entregado]
        FROM [detalleSurtimientos] d
        LEFT JOIN [MEDICAMENTOS] m 
          ON d.[claveMedicamento] = m.[clavemedicamento]
        WHERE d.[folioSurtimiento] = @id AND d.[estatus] = 1
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener detalle de surtimientos:", error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
}
