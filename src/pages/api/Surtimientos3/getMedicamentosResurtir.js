// pages/api/Surtimientos3/getMedicamentosResurtir.js
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

  let pool;
  try {
    pool = await connectToDatabase();
  } catch (err) {
    console.error('Error al conectar BD:', err);
    return res.status(500).json({ error: 'Error de conexión' });
  }

  try {
    // 1) Averigua si es interconsulta
    const consul = await pool
      .request()
      .input('folio', sql.VarChar, folioReceta)
      .query(`
        SELECT TOP 1 especialidadinterconsulta
        FROM PRUEBAS.dbo.consultas 
        WHERE claveconsulta = @folio
      `);

    const isInter = Boolean(
      consul.recordset[0]?.especialidadinterconsulta
    );

    // 2) Según sea interconsulta o no, construye la query adecuada
    let queryText;
    if (isInter) {
      // Caso 2: cualquier medicamento de esta receta
      queryText = `
        SELECT 
          dr.idDetalleReceta,
          dr.descMedicamento       AS clavemedicamento,
          m.medicamento            AS nombreMedicamento,
          dr.indicaciones,
          dr.piezas,
          dr.cantidadMeses,
          dr.surtimientoActual
        FROM PRUEBAS.dbo.detalleReceta dr
        LEFT JOIN PRUEBAS.dbo.MEDICAMENTOS m
          ON dr.descMedicamento = m.clavemedicamento
        WHERE dr.folioReceta = @folio
      `;
    } else {
      // Caso 1: solo aquellos pendientes de resurtimiento
      queryText = `
        SELECT 
          dr.idDetalleReceta,
          dr.descMedicamento       AS clavemedicamento,
          m.medicamento            AS nombreMedicamento,
          dr.indicaciones,
          dr.piezas,
          dr.cantidadMeses,
          dr.surtimientoActual
        FROM PRUEBAS.dbo.detalleReceta dr
        LEFT JOIN PRUEBAS.dbo.MEDICAMENTOS m
          ON dr.descMedicamento = m.clavemedicamento
        WHERE dr.folioReceta = @folio
          AND dr.seAsignoResurtimiento = 1
          AND dr.surtimientoActual < dr.cantidadMeses
      `;
    }
    
    // 3) Ejecuta y devuelve
    const result = await pool
      .request()
      .input('folio', sql.VarChar, folioReceta)
      .query(queryText);

    return res.status(200).json({
      isInterconsulta: isInter,
      items: result.recordset
    });
  } catch (error) {
    console.error('API getMedicamentosResurtir error:', error);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
}
