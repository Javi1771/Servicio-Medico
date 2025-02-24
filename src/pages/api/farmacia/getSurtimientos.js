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

  const [rawNomina, rawClaveMedico, rawFolioPase, rawFolioSurtimiento] = parts;
  const NOMINA = rawNomina;
  const CLAVEMEDICO = parseInt(rawClaveMedico, 10);
  const FOLIO_PASE = parseInt(rawFolioPase, 10);
  const FOLIO_SURTIMIENTO = parseInt(rawFolioSurtimiento, 10);

  try {
    const db = await connectToDatabase();

    // 1) Consulta a SURTIMIENTOS
    const surtimientosQuery = `
      SELECT 
        [FOLIO_SURTIMIENTO],
        [FOLIO_PASE],
        [FECHA_EMISION],
        [NOMINA],
        [CLAVE_PACIENTE],
        [NOMBRE_PACIENTE],
        [EDAD],
        [ESEMPLEADO],
        [CLAVEMEDICO],
        [DIAGNOSTICO],
        [DEPARTAMENTO],
        [ESTATUS],
        [COSTO],
        [FECHA_DESPACHO],
        [SINDICATO],
        [claveusuario]
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
      WHERE NOMINA = @NOMINA
        AND CLAVEMEDICO = @CLAVEMEDICO
        AND FOLIO_PASE = @FOLIO_PASE
        AND FOLIO_SURTIMIENTO = @FOLIO_SURTIMIENTO
    `;
    const surtimientoResult = await db.request()
      .input('NOMINA', sql.NVarChar(15), NOMINA)
      .input('CLAVEMEDICO', sql.Int, CLAVEMEDICO)
      .input('FOLIO_PASE', sql.Int, FOLIO_PASE)
      .input('FOLIO_SURTIMIENTO', sql.Int, FOLIO_SURTIMIENTO)
      .query(surtimientosQuery);

    let surtimiento = surtimientoResult.recordset[0] || null;
    console.log('Resultado de SURTIMIENTOS:', surtimiento);

    // 2) Consulta detalleSurtimientos, uniendo con medicamentos, e incluyendo el campo "entregado"
    const detalleQuery = `
      SELECT
        ds.idSurtimiento,
        ds.claveMedicamento,
        ds.indicaciones,
        ds.cantidad,
        ds.piezas,
        ds.entregado,             
        m.medicamento AS nombreMedicamento,
        m.piezas AS stock
      FROM [PRESIDENCIA].[dbo].[detalleSurtimientos] ds
      LEFT JOIN [PRESIDENCIA].[dbo].[medicamentos] m
        ON ds.claveMedicamento = m.claveMedicamento
      WHERE ds.folioSurtimiento = @FOLIO_SURTIMIENTO
    `;
    const detalleResult = await db.request()
      .input('FOLIO_SURTIMIENTO', sql.Int, FOLIO_SURTIMIENTO)
      .query(detalleQuery);

    const detalleSurtimientos = detalleResult.recordset;

    // 3) Si surtimiento existe, obtener nombres de médico y usuario desde proveedores
    if (surtimiento) {
      // a) Nombre del médico
      const medicoQuery = `
        SELECT nombreproveedor AS nombreMedico
        FROM [PRESIDENCIA].[dbo].[proveedores]
        WHERE claveproveedor = @CLAVEMEDICO
      `;
      const medicoResult = await db.request()
        .input('CLAVEMEDICO', sql.Int, surtimiento.CLAVEMEDICO)
        .query(medicoQuery);
      const doctorName = medicoResult.recordset[0]?.nombreMedico || null;

      // b) Nombre de usuario
      const usuarioQuery = `
        SELECT nombreproveedor AS nombreUsuario
        FROM [PRESIDENCIA].[dbo].[proveedores]
        WHERE claveproveedor = @CLAVEUSUARIO
      `;
      const usuarioResult = await db.request()
        .input('CLAVEUSUARIO', sql.Int, surtimiento.claveusuario)
        .query(usuarioQuery);
      const userName = usuarioResult.recordset[0]?.nombreUsuario || null;

      surtimiento = {
        ...surtimiento,
        doctorName,
        userName,
      };
    }

    return res.status(200).json({ surtimiento, detalleSurtimientos });
  } catch (error) {
    console.error('Error en getSurtimientos API:', error);
    return res.status(500).json({ message: error.message });
  }
}
