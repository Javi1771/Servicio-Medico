// pages/api/Surtimientos3/Valida-Caso2.js
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  const { folioReceta } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!folioReceta) {
    return res.status(400).json({ error: 'Falta folioReceta' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input('folio', sql.VarChar, folioReceta)
      .query(`
        SELECT 
          dr.idDetalleReceta,
          dr.descMedicamento       AS clavemedicamento,
          m.medicamento            AS nombreMedicamento,
          dr.indicaciones,
          dr.piezas,
          dr.cantidadMeses,
          dr.surtimientoActual
        FROM detalleReceta dr
        LEFT JOIN MEDICAMENTOS m
          ON dr.descMedicamento = m.clavemedicamento
        WHERE dr.folioReceta = @folio
          AND dr.seAsignoResurtimiento = 1
          AND dr.surtimientoActual < dr.cantidadMeses
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('API getResurtimientos error:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
}
