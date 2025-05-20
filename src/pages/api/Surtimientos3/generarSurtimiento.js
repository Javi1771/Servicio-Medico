// pages/api/Surtimientos3/generarSurtimiento.js
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  console.log("<<<< DEBUG API generarSurtimiento: req.body INICIO >>>>", JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { folioReceta, consulta: consultaData, medicamentos, claveUsuario } = req.body;

  if (
    !folioReceta ||
    !consultaData ||
    !Array.isArray(medicamentos) ||
    typeof claveUsuario !== 'number'
  ) {
    console.error("Error de validación - Faltan datos obligatorios o tipos incorrectos:", { folioReceta, consultaData, medicamentos, claveUsuario });
    return res
      .status(400)
      .json({ error: 'Faltan datos obligatorios o tipos incorrectos' });
  }

  const camposRequeridosEnConsulta = [
    'clavenomina', 'nombrepaciente', 'edad', 'diagnostico', 'departamento', 'sindicato'
  ];

  for (const campo of camposRequeridosEnConsulta) {
    if (typeof consultaData[campo] === 'undefined') {
      console.error(`Error de validación - Falta el campo '${campo}' en consultaData o es undefined:`, consultaData);
      return res
        .status(400)
        .json({ error: `Falta el campo '${campo}' o es undefined dentro del objeto consulta` });
    }
  }

  // --- Aplicar TRIM a los campos de texto relevantes ---
  const nominaLimpia = (consultaData.clavenomina || '').trim();
  const clavePacienteLimpia = consultaData.clavepaciente !== null && consultaData.clavepaciente !== undefined ? String(consultaData.clavepaciente).trim() : null;
  const nombrePacienteLimpio = (consultaData.nombrepaciente || '').trim();
  const edadLimpia = (consultaData.edad || '').trim();
  const epacienteEsEmpleadoLimpio = consultaData.epacienteEsEmpleado !== null && consultaData.epacienteEsEmpleado !== undefined ? String(consultaData.epacienteEsEmpleado).trim() : null;
  const departamentoLimpio = (consultaData.departamento || '').trim();
  const sindicatoLimpio = (consultaData.sindicato || '').trim();
  const diagnosticoLimpio = (consultaData.diagnostico || '').trim();
  // ----------------------------------------------------


  let pool;
  try {
    pool = await connectToDatabase();
  } catch (err) {
    console.error('Error al conectar a BD:', err);
    return res.status(500).json({ error: 'Error de conexión a BD' });
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const nuevoFolioResult = await transaction.request()
      .query(`SELECT ISNULL(MAX(FOLIO_SURTIMIENTO),0)+1 AS newFolio FROM dbo.SURTIMIENTOS`);
    const newFolio = nuevoFolioResult.recordset[0].newFolio;

    let claveMedicoFinal = null;
    if (consultaData.claveproveedor !== null && consultaData.claveproveedor !== undefined && String(consultaData.claveproveedor).trim() !== '') {
      const parsedMedico = parseInt(String(consultaData.claveproveedor), 10);
      if (!isNaN(parsedMedico)) {
        claveMedicoFinal = parsedMedico;
      }
    }

    const folioPaseInt = parseInt(folioReceta, 10);
    if (isNaN(folioPaseInt)) {
        await transaction.rollback();
        console.error('Error: folioReceta no es un número válido:', folioReceta);
        return res.status(400).json({ error: 'folioReceta (FOLIO_PASE) debe ser un número válido.' });
    }

    console.log("API DEBUG Valores para INPUTS (después de trim):");
    console.log("  nomina:", nominaLimpia);
    console.log("  clavePaciente:", clavePacienteLimpia);
    console.log("  nombrePaciente:", nombrePacienteLimpio);
    console.log("  edad:", edadLimpia);
    console.log("  epacienteEsEmpleado:", epacienteEsEmpleadoLimpio);
    console.log("  claveMedicoFinal:", claveMedicoFinal);
    console.log("  departamento:", departamentoLimpio); // <- El más importante por el error
    console.log("  sindicato:", sindicatoLimpio);
    console.log("  diagnostico:", diagnosticoLimpio);
    console.log("  claveUsuario:", claveUsuario);

    await transaction.request()
      .input("folioSurtimiento",    sql.Int,        newFolio)
      .input("folioPase",           sql.Int,        folioPaseInt)
      .input("fechaEmision",        sql.DateTime,   new Date())
      .input("nomina",              sql.NVarChar(15), nominaLimpia)
      .input("clavePaciente",       sql.NVarChar(15), clavePacienteLimpia)
      .input("nombrePaciente",      sql.NVarChar(50), nombrePacienteLimpio)
      .input("edad",                sql.NVarChar(50), edadLimpia)
      .input("epacienteEsEmpleado", sql.NVarChar(1),  epacienteEsEmpleadoLimpio)
      .input("claveMedico",         sql.Int,        claveMedicoFinal)
      .input("departamento",        sql.NVarChar(100), departamentoLimpio)
      .input("sindicato",           sql.NVarChar(10),  sindicatoLimpio)
      .input("diagnostico",         sql.NVarChar(sql.MAX), diagnosticoLimpio)
      .input("estatusBit",          sql.Bit,        1)
      .input("claveUsuario",        sql.Int,        claveUsuario)
      .input("estadoInt",           sql.Int,        1)
      .input("cancelo",             sql.Int,        0)
      .query(`
        INSERT INTO dbo.SURTIMIENTOS
          (FOLIO_SURTIMIENTO, FOLIO_PASE, FECHA_EMISION, NOMINA,
           CLAVE_PACIENTE, NOMBRE_PACIENTE, EDAD, ESEMPLEADO, CLAVEMEDICO,
           DEPARTAMENTO, SINDICATO, DIAGNOSTICO,
           ESTATUS, claveusuario, ESTADO, CANCELO)
        VALUES
          (@folioSurtimiento, @folioPase, @fechaEmision, @nomina,
           @clavePaciente, @nombrePaciente, @edad, @epacienteEsEmpleado, @claveMedico,
           @departamento, @sindicato, @diagnostico,
           @estatusBit, @claveUsuario, @estadoInt, @cancelo)
      `);

    const queryDetalle = `
      INSERT INTO dbo.detalleSurtimientos
        (folioSurtimiento, claveMedicamento, indicaciones,
         cantidad, estatus, piezas, entregado)
      VALUES
        (@folioSurtimiento, @claveMedicamento, @indicaciones,
         @cantidad, @estatusDetalle, @piezas, @entregado)
    `;

    for (const med of medicamentos) {
      const piezasInt = parseInt(String(med.piezas), 10);
      if (isNaN(piezasInt)) {
          await transaction.rollback();
          console.error('Error: Piezas de medicamento no es un número válido:', med.piezas);
          return res.status(400).json({ error: `Piezas para el medicamento ${med.descMedicamento} debe ser un número válido.` });
      }
      // Aplicar trim a indicaciones de medicamentos también, ya que es NVARCHAR(MAX)
      const indicacionesLimpias = (med.indicaciones || '').trim();

      await transaction.request()
        .input("folioSurtimiento",   sql.Int,        newFolio)
        .input("claveMedicamento",   sql.NVarChar(20), (med.descMedicamento || '').trim()) // También trim por si acaso
        .input("indicaciones",       sql.NVarChar(sql.MAX), indicacionesLimpias)
        .input("cantidad",           sql.VarChar(50),  String(med.cantidad).trim())
        .input("estatusDetalle",     sql.Int,        1)
        .input("piezas",             sql.Int,        piezasInt)
        .input("entregado",          sql.Int,        0)
        .query(queryDetalle);
    }

    await transaction.commit();
    return res.status(200).json({ folioSurtimiento: newFolio });

  } catch (error) {
    if (transaction && transaction._aborted === false && transaction._rolledBack === false) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error al hacer rollback de la transacción:', rollbackError);
        }
    }
    console.error('Error en la transacción de generarSurtimiento:', error.message, error.stack);
    let errorMessage = 'Error en la transacción al generar surtimiento.';
    if (error.originalError && error.originalError.info && error.originalError.info.message) {
        errorMessage = `Error de base de datos: ${error.originalError.info.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}