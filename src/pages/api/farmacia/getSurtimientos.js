// pages/api/farmacia/getSurtimientos.js
import { connectToDatabase } from '../../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { barcode } = req.body;
  if (!barcode) {
    return res.status(400).json({ message: 'Código de barras requerido' });
  }

  // Se espera el formato "NOMINA CLAVEMEDICO FOLIO_PASE FOLIO_SURTIMIENTO"
  const parts = barcode.trim().split(' ');
  if (parts.length !== 4) {
    return res.status(400).json({ message: 'Formato de código de barras inválido' });
  }

  const [NOMINA, CLAVEMEDICO, FOLIO_PASE, FOLIO_SURTIMIENTO] = parts;
  console.log('Valores recibidos: ', { NOMINA, CLAVEMEDICO, FOLIO_PASE, FOLIO_SURTIMIENTO });

  try {
    // Se obtiene el pool de conexiones directamente
    const db = await connectToDatabase();
    console.log('Conexión a la base de datos exitosa');

    // Consulta a la tabla SURTIMIENTOS
    const surtimientosQuery = `
      SELECT *
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
      WHERE NOMINA = @NOMINA
        AND CLAVEMEDICO = @CLAVEMEDICO
        AND FOLIO_PASE = @FOLIO_PASE
        AND FOLIO_SURTIMIENTO = @FOLIO_SURTIMIENTO
    `;
    const surtimientoResult = await db.request()
      .input('NOMINA', sql.VarChar, NOMINA)
      .input('CLAVEMEDICO', sql.VarChar, CLAVEMEDICO)
      .input('FOLIO_PASE', sql.VarChar, FOLIO_PASE)
      .input('FOLIO_SURTIMIENTO', sql.VarChar, FOLIO_SURTIMIENTO)
      .query(surtimientosQuery);

    const surtimiento = surtimientoResult.recordset[0] || null;
    console.log('Resultado de SURTIMIENTOS:', surtimiento);

    // Consulta a la tabla detalleSurtimientos para obtener los medicamentos
    const detalleQuery = `
      SELECT idSurtimiento, claveMedicamento, indicaciones, cantidad, piezas
      FROM [PRESIDENCIA].[dbo].[detalleSurtimientos]
      WHERE folioSurtimiento = @FOLIO_SURTIMIENTO
    `;
    const detalleResult = await db.request()
      .input('FOLIO_SURTIMIENTO', sql.VarChar, FOLIO_SURTIMIENTO)
      .query(detalleQuery);

    const detalleSurtimientos = detalleResult.recordset;
    console.log('Resultado de detalleSurtimientos:', detalleSurtimientos);

    return res.status(200).json({ surtimiento, detalleSurtimientos });
  } catch (error) {
    console.error('Error en getSurtimientos API:', error);
    return res.status(500).json({ message: error.message });
  }
}
