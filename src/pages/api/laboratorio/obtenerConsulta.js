import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  const { folio } = req.query;
  //console.log("🔍 Endpoint - obtenerConsultaEspecialidad");
  //console.log("📌 Parámetro recibido - Folio:", folio);

  if (req.method !== "GET") {
    //console.log("❌ Método no permitido:", req.method);
    return res.status(405).json({ error: "Método no permitido" });
  }

  const folioInt = parseInt(folio, 10);
  if (isNaN(folioInt)) {
    //console.log("❌ El parámetro 'folio' no es un número válido:", folio);
    return res
      .status(400)
      .json({ error: "El parámetro 'folio' debe ser un número válido" });
  }

  try {
    const pool = await connectToDatabase();
    //console.log("✅ Conexión exitosa a la base de datos");

    //? 1. Obtener datos de "consultas"
    //console.log("📄 Ejecutando consulta a 'consultas'");
    const consultaQuery = `
      SELECT c.claveconsulta, c.nombrepaciente, c.edad, c.parentesco, 
      c.sindicato, c.clavenomina, c.clavepaciente, c.elpacienteesempleado, 
      c.departamento, c.diagnostico, c.especialidadinterconsulta, p.nombreproveedor as medico  
      FROM consultas c
      INNER JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      WHERE claveconsulta = @folio
        AND clavestatus = 2
    `;
    const consultaRequest = pool.request();
    consultaRequest.timeout = 0; //! Deshabilitar timeout
    const consultaResult = await consultaRequest
      .input("folio", sql.Int, folioInt)
      .query(consultaQuery);

    //console.log("📊 Resultado de 'consultas':", consultaResult.recordset);
    if (consultaResult.recordset.length === 0) {
      //console.log("⚠️ No se encontró ninguna consulta con el folio:", folio);
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    //* Extraer datos de la primera fila y asegurar que 'parentesco' no sea un arreglo
    const consulta = consultaResult.recordset[0];
    if (Array.isArray(consulta.parentesco)) {
      console.warn("⚠️ El campo 'parentesco' se recibió como un arreglo. Corrigiendo...");
      consulta.parentesco = consulta.parentesco[0];
    }
    //console.log("📋 Consulta después de procesar el parentesco:", consulta);

    //* Definir las queries que se pueden ejecutar en paralelo
    const parentescoQuery = `
      SELECT PARENTESCO
      FROM PARENTESCO
      WHERE ID_PARENTESCO = @parentescoId
    `;
    const tipoConsultaQuery = `
      SELECT especialidad, claveespecialidad
      FROM especialidades
      WHERE claveespecialidad = @tipoConsultaClave
    `;
    const especialidadMedicoQuery = `
      SELECT e.especialidad, e.claveespecialidad
      FROM detalleEspecialidad d
      JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
      WHERE d.claveconsulta = @folio
    `;
    const especialistasQuery = `
      SELECT claveproveedor, nombreproveedor, costo
      FROM proveedores
      WHERE claveespecialidad = @claveEspecialidad
      AND activo = 'S'
      ORDER BY nombreproveedor ASC
    `;

    //? 2. Ejecutar consultas en paralelo con cada request sin timeout
    const parentescoRequest = pool.request();
    parentescoRequest.timeout = 0;
    const parentescoPromise =
      (consulta.parentesco !== 0 &&
        consulta.parentesco !== "Empleado" &&
        !isNaN(consulta.parentesco))
        ? parentescoRequest
            .input("parentescoId", sql.Int, consulta.parentesco)
            .query(parentescoQuery)
        : Promise.resolve(null);

    const tipoConsultaRequest = pool.request();
    tipoConsultaRequest.timeout = 0;
    const tipoConsultaPromise =
      consulta.especialidadinterconsulta != null
        ? tipoConsultaRequest
            .input("tipoConsultaClave", sql.Int, consulta.especialidadinterconsulta)
            .query(tipoConsultaQuery)
        : Promise.resolve(null);

    const especialidadMedicoRequest = pool.request();
    especialidadMedicoRequest.timeout = 0;
    const especialidadMedicoPromise = especialidadMedicoRequest
      .input("folio", sql.Int, folioInt)
      .query(especialidadMedicoQuery);

    const especialistasRequest = pool.request();
    especialistasRequest.timeout = 0;
    const especialistasPromise = especialistasRequest
      .input("claveEspecialidad", sql.Int, 38)
      .query(especialistasQuery);

    //* Ejecutar todas las consultas en paralelo
    const [
      parentescoResult,
      tipoConsultaResult,
      especialidadMedicoResult,
      especialistasResult,
    ] = await Promise.all([
      parentescoPromise,
      tipoConsultaPromise,
      especialidadMedicoPromise,
      especialistasPromise,
    ]);

    //? 3. Procesar resultado del parentesco
    let parentescoNombre = "EMPLEADO"; //! Valor por defecto
    if (consulta.parentesco === 0 || consulta.parentesco === "Empleado") {
      //console.log("ℹ️ Parentesco identificado directamente como EMPLEADO");
    } else if (parentescoResult && parentescoResult.recordset.length > 0) {
      parentescoNombre = parentescoResult.recordset[0].PARENTESCO;
    } else {
      //console.log("⚠️ No se encontró un parentesco para el ID proporcionado");
    }

    //? 4. Procesar el tipo de consulta según especialidadinterconsulta
    let tipoConsulta = {};
    if (consulta.especialidadinterconsulta == null) {
      //console.log("ℹ️ especialidadinterconsulta es NULL. Se asigna 'Consulta General'");
      tipoConsulta = {
        mensaje: "Consulta General",
        especialidad: "Consulta General",
        claveespecialidad: null,
      };
    } else if (tipoConsultaResult && tipoConsultaResult.recordset.length > 0) {
      //console.log("ℹ️ Se encontró la especialidad para la consulta");
      tipoConsulta = {
        ...tipoConsultaResult.recordset[0],
        mensaje: "Consulta Especialidad",
      };
    } else {
      //console.log("⚠️ No se encontró una especialidad para el valor:", consulta.especialidadinterconsulta);
      tipoConsulta = {
        mensaje: "Consulta General",
        especialidad: "Consulta General",
        claveespecialidad: null,
      };
    }

    //? 5. Procesar la especialidad asignada por el médico
    //console.log("📊 Resultado de 'especialidad_medico':", especialidadMedicoResult.recordset);
    let especialidadMedico = null;
    if (especialidadMedicoResult.recordset.length > 0) {
      especialidadMedico = especialidadMedicoResult.recordset[0];
    } else {
      //console.log("⚠️ No se encontró la especialidad asignada por el médico");
    }

    //? 6. Procesar especialistas
    //console.log("📊 Resultado de 'proveedores':", especialistasResult.recordset);

    res.status(200).json({
      paciente: consulta,
      parentesco: parentescoNombre,
      tipoConsulta,           //* Información sobre si fue "Consulta General" o "Consulta Especialidad"
      especialidad_medico: especialidadMedico, //* Especialidad asignada por el médico
      especialistas: especialistasResult.recordset,
    });
  } catch (error) {
    console.error("❌ Error en obtenerConsultaEspecialidad:", error.message);
    res.status(500).json({ error: "Error al obtener datos", details: error.message });
  }
}
