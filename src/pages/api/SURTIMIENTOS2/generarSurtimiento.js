// /pages/api/SURTIMIENTOS2/generarSurtimiento.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(`Método no permitido: ${req.method}`);
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioReceta, medicamentos, diagnostico } = req.body;
  console.log("Recibiendo solicitud con folioReceta:", folioReceta);

  if (!folioReceta) {
    console.log("folioReceta no proporcionado en el cuerpo de la solicitud.");
    return res.status(400).json({ message: "folioReceta es requerido" });
  }

  if (!medicamentos || medicamentos.length === 0) {
    console.log("No hay medicamentos proporcionados.");
    return res.status(400).json({ message: "Medicamentos son requeridos" });
  }

  if (!diagnostico) {
    console.log("Diagnóstico no proporcionado.");
    return res.status(400).json({ message: "Diagnóstico es requerido" });
  }

  let pool;
  let transaction;

  try {
    pool = await connectToDatabase();
    console.log("Conexión a la base de datos establecida.");

    // Iniciar una transacción
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    console.log("Transacción iniciada.");

    // 1. Verificar si ya se ha generado un surtimiento para este folio
    const verificaRequest = new sql.Request(transaction);
    const verificaQuery = `
      SELECT COUNT(*) AS count
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
      WHERE FOLIO_PASE = @folioReceta
    `;
    const verificaResult = await verificaRequest
      .input("folioReceta", sql.Int, folioReceta)
      .query(verificaQuery);

    console.log("Resultado de la verificación de surtimiento:", verificaResult.recordset[0]);

    if (verificaResult.recordset[0].count > 0) {
      console.log("Ya se ha generado un surtimiento para este folio.");
      await transaction.rollback();
      return res.status(400).json({ message: "Ya se ha generado un surtimiento para este folio." });
    }

    // 2. Generar un nuevo FOLIO_SURTIMIENTO
    const folioRequest = new sql.Request(transaction);
    const folioQuery = `
      SELECT ISNULL(MAX(FOLIO_SURTIMIENTO), 0) + 1 AS nuevoFolio
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
    `;
    const folioResult = await folioRequest.query(folioQuery);
    const nuevoFolio = folioResult.recordset[0].nuevoFolio;
    console.log("Nuevo folio generado:", nuevoFolio);

    // 3. Obtener los datos del folio de consulta
    const consultaRequest = new sql.Request(transaction);
    const consultaQuery = `
      SELECT clavenomina, sindicato, clavepaciente, nombrepaciente, edad, elpacienteesempleado,
             claveproveedor, departamento, clavestatus, claveusuario
      FROM [PRESIDENCIA].[dbo].[consultas]
      WHERE claveconsulta = @folioReceta
    `;
    const consultaResult = await consultaRequest
      .input("folioReceta", sql.Int, folioReceta)
      .query(consultaQuery);

    if (consultaResult.recordset.length === 0) {
      console.error("No se encontró información para el folio:", folioReceta);
      await transaction.rollback();
      return res.status(404).json({ message: "No se encontró información del folio." });
    }

    const consulta = consultaResult.recordset[0];
    console.log("Datos de la consulta encontrados:", consulta);

    // 4. Determinar el sindicato con base en clavenomina
    const getSindicato = (clavenomina) => {
      if (clavenomina.startsWith("9")) {
        return "SUTSMSJR";
      } else if (clavenomina.startsWith("8")) {
        return "SITAM";
      } else if (clavenomina.startsWith("3")) { // Ajusta esta lógica según tus reglas
        return "OTRO_SINDICATO"; // Reemplaza con el sindicato correcto
      } else {
        return null;
      }
    };

    const sindicato = getSindicato(consulta.clavenomina);
    console.log("Sindicato determinado:", sindicato);

    // 5. Normalizar el valor del campo departamento
    let departamento = consulta.departamento || null;
    if (departamento && departamento.length > 100) {
      departamento = departamento.substring(0, 100);
    }
    console.log("Longitud del valor del campo departamento después de normalizar:", departamento ? departamento.length : 0);

    // 6. Verificar que los campos necesarios no sean NULL
    if (!consulta.clavenomina) {
      console.warn("clavenomina es NULL o undefined");
    }
    if (!consulta.clavepaciente) {
      console.warn("clavepaciente es NULL o undefined");
    }
    if (!consulta.nombrepaciente) {
      console.warn("nombrepaciente es NULL o undefined");
    }
    if (!consulta.edad) {
      console.warn("edad es NULL o undefined");
    }
    if (!consulta.elpacienteesempleado) {
      console.warn("elpacienteesempleado es NULL o undefined");
    }
    if (!consulta.claveproveedor) {
      console.warn("claveproveedor es NULL o undefined");
    }
    if (!diagnostico) {
      console.warn("diagnostico es NULL o undefined");
    }
    if (!departamento) {
      console.warn("departamento es NULL o undefined");
    }
    if (sindicato === null) {
      console.warn("sindicato es NULL o undefined");
    }
    if (!consulta.claveusuario) {
      console.warn("claveusuario es NULL o undefined");
    }

    // 7. Insertar en la tabla SURTIMIENTOS
    const insertSurtimientoRequest = new sql.Request(transaction);
    const insertSurtimientoQuery = `
      INSERT INTO [PRESIDENCIA].[dbo].[SURTIMIENTOS] (
        FOLIO_SURTIMIENTO, FOLIO_PASE, FECHA_EMISION, NOMINA, CLAVE_PACIENTE,
        NOMBRE_PACIENTE, EDAD, ESEMPLEADO, CLAVEMEDICO, DIAGNOSTICO,
        DEPARTAMENTO, ESTATUS, COSTO, FECHA_DESPACHO, SINDICATO, claveusuario
      ) VALUES (
        @nuevoFolio, @folioPase, GETDATE(), @nomina, @clavePaciente,
        @nombrePaciente, @edad, @esEmpleado, @claveMedico, @diagnostico,
        @departamento, @estatus, NULL, NULL, @sindicato, @claveUsuario
      )
    `;

    console.log("Insertando en SURTIMIENTOS con los siguientes datos:");
    console.log("nuevoFolio:", nuevoFolio);
    console.log("folioPase:", folioReceta);
    console.log("nomina:", consulta.clavenomina);
    console.log("clavePaciente:", consulta.clavepaciente);
    console.log("nombrePaciente:", consulta.nombrepaciente);
    console.log("edad:", consulta.edad);
    console.log("esEmpleado:", consulta.elpacienteesempleado);
    console.log("claveMedico:", consulta.claveproveedor);
    console.log("diagnostico:", diagnostico);
    console.log("departamento:", departamento);
    console.log("estatus:", consulta.clavestatus);
    console.log("sindicato:", sindicato);
    console.log("claveUsuario:", consulta.claveusuario);

    // **Mapear 'clavestatus' a BIT**
    // Si 'clavestatus' es mayor que 0, asigna 1, de lo contrario 0
    const estatusBIT = consulta.clavestatus > 0 ? 1 : 0;

    await insertSurtimientoRequest
      .input("nuevoFolio", sql.Int, nuevoFolio)
      .input("folioPase", sql.Int, folioReceta)
      .input("nomina", sql.NVarChar(15), consulta.clavenomina || null)
      .input("clavePaciente", sql.NVarChar(15), consulta.clavepaciente)
      .input("nombrePaciente", sql.NVarChar(50), consulta.nombrepaciente)
      .input("edad", sql.NVarChar(50), String(consulta.edad || "0"))
      .input("esEmpleado", sql.NVarChar(1), consulta.elpacienteesempleado)
      .input("claveMedico", sql.Int, consulta.claveproveedor)
      .input("diagnostico", sql.NVarChar(sql.MAX), diagnostico)
      .input("departamento", sql.NVarChar(100), departamento)
      .input("estatus", sql.Bit, estatusBIT) // Usar 'estatusBIT' aquí
      .input("sindicato", sql.NVarChar(10), sindicato || null)
      .input("claveUsuario", sql.Int, consulta.claveusuario)
      .query(insertSurtimientoQuery);

    console.log("Surtimiento insertado exitosamente.");

    // 8. Insertar medicamentos en la tabla detalleSurtimientos
    const insertDetalleQuery = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleSurtimientos] (
        folioSurtimiento, claveMedicamento, indicaciones, cantidad, estatus
      ) VALUES (
        @folioSurtimiento, @claveMedicamento, @indicaciones, @cantidad, 1
      )
    `;

    for (const medicamento of medicamentos) { // Asegúrate de que 'medicamentos' es el nombre correcto
      console.log("Insertando medicamento:", medicamento);
      
      // Crear una nueva instancia de sql.Request para cada medicamento
      const insertDetalleRequest = new sql.Request(transaction);
      
      await insertDetalleRequest
        .input("folioSurtimiento", sql.Int, nuevoFolio)
        .input("claveMedicamento", sql.NVarChar(12), medicamento.claveMedicamento)
        .input("indicaciones", sql.NVarChar(sql.MAX), medicamento.indicaciones)
        .input("cantidad", sql.NVarChar(70), medicamento.cantidad)
        .query(insertDetalleQuery);
    }
    
    console.log("Todos los medicamentos insertados exitosamente.");

    // 9. Actualizar el diagnóstico en la tabla consultas
    const updateConsultaRequest = new sql.Request(transaction);
    const updateConsultaQuery = `
      UPDATE [PRESIDENCIA].[dbo].[consultas]
      SET diagnostico = @diagnostico
      WHERE claveconsulta = @folioReceta
    `;
    await updateConsultaRequest
      .input("diagnostico", sql.NVarChar(sql.MAX), diagnostico)
      .input("folioReceta", sql.Int, folioReceta)
      .query(updateConsultaQuery);

    console.log("Diagnóstico actualizado exitosamente.");

    // 10. Confirmar la transacción
    await transaction.commit();
    console.log("Transacción confirmada exitosamente.");

    res.status(200).json({ message: "Receta guardada exitosamente." });
  } catch (error) {
    console.error("Error al guardar la receta:", error.message);
    if (transaction) {
      try {
        await transaction.rollback();
        console.log("Transacción revertida debido a un error.");
      } catch (rollbackError) {
        console.error("Error al revertir la transacción:", rollbackError);
      }
    }
    res.status(500).json({ message: "Error interno del servidor." });
  }
}
