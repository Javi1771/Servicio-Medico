// src/pages/api/Surtimientos3/getConsultaDataSurtimientos.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

// formatea fechas
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  let horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  horas = horas % 12 === 0 ? 12 : horas % 12;
  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas}:${minutos} ${periodo}`;
}

/**
 * Esta función la usaremos en diferentes endpoints para leer
 * consulta, receta, incapacidades, detalleEspecialidad y el
 * ÚLTIMO folio de surtimiento.
 * 
 * @param {number} claveconsulta - ID de la consulta
 * @param {Object} contextoPDF - Contexto pasado desde la tabla (opcional)
 */
export async function getConsultaDataSurtimientos(claveconsulta, contextoPDF = null) {
  const db = await connectToDatabase();

  // 1) consulta principal (se usa TRY_CAST en el JOIN de parentesco)
  let consultaData = null;
  try {
    const consultaQuery = `
      SELECT 
        c.claveconsulta,
        c.fechaconsulta,
        c.clavenomina,
        c.presionarterialpaciente,
        c.temperaturapaciente,
        c.pulsosxminutopaciente,
        c.respiracionpaciente,
        c.estaturapaciente,
        c.pesopaciente,
        c.glucosapaciente,
        c.nombrepaciente,
        c.edad,
        c.clavestatus,
        c.motivoconsulta,
        c.elpacienteesempleado,
        c.parentesco,
        c.clavepaciente,
        c.departamento,
        c.sindicato,
        c.claveproveedor,
        c.diagnostico,
        c.seAsignoIncapacidad,
        c.especialidadinterconsulta,
        c.seasignoaespecialidad,
        c.fechacita,
        p.nombreproveedor,
        p.cedulaproveedor,
        pa.PARENTESCO AS parentescoNombre,
        es.especialidad AS especialidadNombre
      FROM consultas c
      LEFT JOIN proveedores p 
        ON c.claveproveedor = p.claveproveedor
      LEFT JOIN PARENTESCO pa 
        ON TRY_CAST(c.parentesco AS SMALLINT) = pa.ID_PARENTESCO
      LEFT JOIN especialidades es 
        ON c.especialidadinterconsulta = es.claveespecialidad
      WHERE c.claveconsulta = @claveconsulta
    `;
    const consultaResult = await db
      .request()
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(consultaQuery);
    consultaData = consultaResult.recordset[0] || null;

    if (consultaData?.fechaconsulta) {
      consultaData.fechaconsulta = formatFecha(consultaData.fechaconsulta);
    }
    if (consultaData?.fechacita) {
      consultaData.fechacita = formatFecha(consultaData.fechacita);
    }
  } catch (err) {
    console.error("❌ Error en [consulta principal]:", err);
    throw new Error(`Fallo en consulta principal: ${err.message}`);
  }

  // 2) 🧠 LÓGICA INTELIGENTE PARA MEDICAMENTOS
  let recetaResult;
  try {
    // ✅ Verificar si es interconsulta
    const isInterconsulta = Boolean(consultaData?.especialidadinterconsulta);
    
    let esPrimerSurtimiento = false;
    let tipoEscenario = "RESURTIMIENTO_REAL";
    
    if (isInterconsulta) {
      // 🚀 OPCIÓN B: Verificar surtimientos EXCLUYENDO el último (recién creado)
      const surtimientosPrevios = await db
        .request()
        .input("claveconsulta", sql.Int, claveconsulta)
        .query(`
          SELECT COUNT(*) as totalSurtimientos
          FROM SURTIMIENTOS 
          WHERE FOLIO_PASE = @claveconsulta
            AND FECHA_EMISION < DATEADD(MINUTE, -1, GETDATE()) -- Excluir surtimientos de último minuto
        `);
      
      const yaSeHaSurtidoAntes = surtimientosPrevios.recordset[0]?.totalSurtimientos > 0;
      esPrimerSurtimiento = !yaSeHaSurtidoAntes;
      
      console.log(`📋 PDF - Verificación de surtimientos previos:`);
      console.log(`   - Surtimientos anteriores: ${surtimientosPrevios.recordset[0]?.totalSurtimientos}`);
      console.log(`   - Es primer surtimiento (ignorando el recién creado): ${esPrimerSurtimiento}`);
    }

    tipoEscenario = isInterconsulta && esPrimerSurtimiento 
      ? "INTERCONSULTA_PRIMER_SURTIMIENTO" 
      : "RESURTIMIENTO_REAL";

    console.log(`📋 PDF - Análisis CORREGIDO del folio ${claveconsulta}:`);
    console.log(`   - Es interconsulta: ${isInterconsulta}`);
    console.log(`   - Es primer surtimiento: ${esPrimerSurtimiento}`);
    console.log(`   - Escenario aplicado: ${tipoEscenario}`);

    // ✅ APLICAR LA LÓGICA SEGÚN EL ESCENARIO
    let recetaQuery;
    if (tipoEscenario === "INTERCONSULTA_PRIMER_SURTIMIENTO") {
      // PRIMER SURTIMIENTO DE INTERCONSULTA → TODOS los medicamentos
      recetaQuery = `
        SELECT
          dr.idDetalleReceta,
          dr.indicaciones,
          dr.cantidad,
          dr.descMedicamento AS idMedicamento,
          dr.piezas,
          dr.seAsignoResurtimiento,
          dr.cantidadMeses,
          dr.surtimientoActual,
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(m.medicamento, ', ', ','),
                ',', ' , '
              ),
              ' / ', '/'
            ),
            '/', ' / '
          ) AS nombreMedicamento,
          m.clasificacion
        FROM detalleReceta dr
        LEFT JOIN MEDICAMENTOS m 
          ON dr.descMedicamento = m.claveMedicamento
        WHERE dr.folioReceta = @claveconsulta
        ORDER BY dr.idDetalleReceta
      `;
      console.log(`🎯 PDF - Escenario: ${tipoEscenario} - Mostrando TODOS los medicamentos`);
    } else {
      // RESURTIMIENTO REAL → Solo medicamentos pendientes
      recetaQuery = `
        SELECT
          dr.idDetalleReceta,
          dr.indicaciones,
          dr.cantidad,
          dr.descMedicamento AS idMedicamento,
          dr.piezas,
          dr.seAsignoResurtimiento,
          dr.cantidadMeses,
          dr.surtimientoActual,
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(m.medicamento, ', ', ','),
                ',', ' , '
              ),
              ' / ', '/'
            ),
            '/', ' / '
          ) AS nombreMedicamento,
          m.clasificacion
        FROM detalleReceta dr
        LEFT JOIN MEDICAMENTOS m 
          ON dr.descMedicamento = m.claveMedicamento
        WHERE dr.folioReceta = @claveconsulta
          AND dr.seAsignoResurtimiento = 1
          AND dr.surtimientoActual < dr.cantidadMeses
        ORDER BY dr.idDetalleReceta
      `;
      console.log(`🎯 PDF - Escenario: ${tipoEscenario} - Solo medicamentos pendientes`);
    }

    recetaResult = await db
      .request()
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(recetaQuery);

    console.log(`📋 PDF - Medicamentos encontrados: ${recetaResult.recordset.length}`);

  } catch (err) {
    console.error("❌ Error en [detalleReceta]:", err);
    throw new Error(`Fallo en detalleReceta: ${err.message}`);
  }

  // 3) incapacidades (con tipo numérico)
  let incapacidades = [];
  try {
    const incapQuery = `
      SELECT fechaInicial, fechaFinal, claveConsulta
      FROM detalleIncapacidad
      WHERE claveConsulta = @claveconsulta
    `;
    const incapResult = await db
      .request()
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(incapQuery);

    incapacidades = incapResult.recordset.map(i => ({
      ...i,
      fechaInicial: formatFecha(i.fechaInicial),
      fechaFinal: formatFecha(i.fechaFinal),
    }));
  } catch (err) {
    console.error("❌ Error en [detalleIncapacidad]:", err);
    throw new Error(`Fallo en detalleIncapacidad: ${err.message}`);
  }

  // 4) detalleEspecialidad (con tipo numérico)
  let detEspResult;
  try {
    const detEspQuery = `
      SELECT de.observaciones,
             de.claveespecialidad,
             e.especialidad AS nombreEspecialidad
      FROM detalleEspecialidad de
      LEFT JOIN especialidades e 
        ON de.claveespecialidad = e.claveespecialidad
      WHERE de.claveconsulta = @claveconsulta
    `;
    detEspResult = await db
      .request()
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(detEspQuery);
  } catch (err) {
    console.error("❌ Error en [detalleEspecialidad]:", err);
    throw new Error(`Fallo en detalleEspecialidad: ${err.message}`);
  }

  // 5) último folio surtimiento (con tipo numérico)
  let folioSurtimiento = null;
  try {
    const folioSurtQuery = `
      SELECT TOP 1 FOLIO_SURTIMIENTO
      FROM SURTIMIENTOS
      WHERE FOLIO_PASE = @claveconsulta
      ORDER BY FOLIO_SURTIMIENTO DESC
    `;
    const folioSurtResult = await db
      .request()
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(folioSurtQuery);

    folioSurtimiento = folioSurtResult.recordset[0]?.FOLIO_SURTIMIENTO || null;
  } catch (err) {
    console.error("❌ Error en [último folioSurtimiento]:", err);
    throw new Error(`Fallo en obtención de folio: ${err.message}`);
  }

  return {
    consulta: consultaData,
    receta: recetaResult.recordset,
    incapacidades,
    detalleEspecialidad: detEspResult.recordset,
    folioSurtimiento,
  };
}

/**
 * Este handler expone la misma lógica por HTTP GET,
 * pero la parte "pesada" está en getConsultaDataSurtimientos().
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }
  const { claveconsulta, escenario, esPrimerSurtimiento, isInterconsulta } = req.query;
  const numClave = parseInt(claveconsulta, 10);
  if (isNaN(numClave)) {
    return res.status(400).json({ message: "El parámetro 'claveconsulta' debe ser un número válido" });
  }
  
  // ✅ PREPARAR CONTEXTO SI SE PASARON PARÁMETROS
  const contextoPDF = (escenario && esPrimerSurtimiento && isInterconsulta) ? {
    escenario,
    esPrimerSurtimiento,
    isInterconsulta
  } : null;
  
  try {
    const data = await getConsultaDataSurtimientos(numClave, contextoPDF);
    if (!data.consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("🔴 Error en getConsultaDataSurtimientos API:", err);
    return res.status(500).json({ message: "Error interno", error: err.message });
  }
}