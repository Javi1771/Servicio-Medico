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
    // 1) Verificar si es interconsulta
    const consultaInfo = await pool
      .request()
      .input('folio', sql.VarChar, folioReceta)
      .query(`
        SELECT 
          especialidadinterconsulta,
          diagnostico
        FROM consultas 
        WHERE claveconsulta = @folio
      `);

    const isInterconsulta = Boolean(consultaInfo.recordset[0]?.especialidadinterconsulta);
    const tieneDiagnostico = Boolean(consultaInfo.recordset[0]?.diagnostico?.trim());

    // 2) 🧠 LÓGICA INTELIGENTE: Determinar si es "primer surtimiento" o "resurtimiento real"
    let esPrimerSurtimiento = false;
    
    if (isInterconsulta) {
      // Para interconsultas, verificar si ya se han hecho surtimientos previos
      const surtimientosPrevios = await pool
        .request()
        .input('folio', sql.VarChar, folioReceta)
        .query(`
          SELECT COUNT(*) as totalSurtimientos
          FROM SURTIMIENTOS 
          WHERE FOLIO_PASE = @folio
        `);
      
      const yaSeHaSurtido = surtimientosPrevios.recordset[0]?.totalSurtimientos > 0;
      esPrimerSurtimiento = !yaSeHaSurtido;
    }

    console.log(`🔍 Análisis del folio ${folioReceta}:`);
    console.log(`   - Es interconsulta: ${isInterconsulta}`);
    console.log(`   - Tiene diagnóstico: ${tieneDiagnostico}`);
    console.log(`   - Es primer surtimiento: ${esPrimerSurtimiento}`);

    // 3) 🎯 SELECCIONAR QUERY SEGÚN EL ESCENARIO
    let queryText;
    let tipoEscenario;

    if (isInterconsulta && esPrimerSurtimiento) {
      // ESCENARIO A: Interconsulta + Primer surtimiento → TODOS los medicamentos
      tipoEscenario = "INTERCONSULTA_PRIMER_SURTIMIENTO";
      queryText = `
        SELECT 
          dr.idDetalleReceta,
          dr.descMedicamento       AS clavemedicamento,
          m.medicamento            AS nombreMedicamento,
          dr.indicaciones,
          dr.cantidad,
          dr.piezas,
          dr.cantidadMeses,
          dr.surtimientoActual,
          dr.seAsignoResurtimiento
        FROM detalleReceta dr
        LEFT JOIN MEDICAMENTOS m
          ON dr.descMedicamento = m.clavemedicamento
        WHERE dr.folioReceta = @folio
        ORDER BY dr.idDetalleReceta
      `;
    } else {
      // ESCENARIO B: Consulta normal O interconsulta con surtimientos previos → Solo pendientes
      tipoEscenario = isInterconsulta ? "INTERCONSULTA_RESURTIMIENTO" : "CONSULTA_NORMAL_RESURTIMIENTO";
      queryText = `
        SELECT 
          dr.idDetalleReceta,
          dr.descMedicamento       AS clavemedicamento,
          m.medicamento            AS nombreMedicamento,
          dr.indicaciones,
          dr.cantidad,
          dr.piezas,
          dr.cantidadMeses,
          dr.surtimientoActual,
          dr.seAsignoResurtimiento
        FROM detalleReceta dr
        LEFT JOIN MEDICAMENTOS m
          ON dr.descMedicamento = m.clavemedicamento
        WHERE dr.folioReceta = @folio
          AND dr.seAsignoResurtimiento = 1
          AND dr.surtimientoActual < dr.cantidadMeses
        ORDER BY dr.idDetalleReceta
      `;
    }

    // 4) Ejecutar query
    const result = await pool
      .request()
      .input('folio', sql.VarChar, folioReceta)
      .query(queryText);

    console.log(`📋 Medicamentos encontrados: ${result.recordset.length}`);
    console.log(`🎯 Escenario aplicado: ${tipoEscenario}`);

    return res.status(200).json({
      isInterconsulta,
      esPrimerSurtimiento,
      tipoEscenario,
      items: result.recordset
    });

  } catch (error) {
    console.error('API getMedicamentosResurtir error:', error);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
}