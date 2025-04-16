import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavenomina, clavepaciente, idRegistro } = req.query;

  //* Log de parámetros recibidos
  // console.log("Parámetros recibidos:", {
  //   clavenomina,
  //   clavepaciente,
  //   idRegistro,
  // });

  //* Verifica que se proporcionen los parámetros necesarios
  if (!idRegistro && (!clavenomina || !clavepaciente)) {
    return res.status(400).json({
      message:
        "Faltan parámetros requeridos: idRegistro, o clavenomina y clavepaciente",
    });
  }

  try {
    const pool = await connectToDatabase();

    let query;
    let inputParams = [];

    //* ----------------------------------------------------------------------------------
    //* Consulta para "idRegistro"
    //* ----------------------------------------------------------------------------------
    if (idRegistro) {
      query = `
        SELECT
          KPI.id_registro_kpi AS idRegistro,
          KPI.id_kpi AS idKPI,
          T.kpi AS nombreKPI,
          KPI.clavenomina,
          KPI.clavepaciente,
          KPI.valor_actual,
          KPI.valor_objetivo,
          KPI.valor_alcanzado,
          KPI.calificacion,
          CONVERT(VARCHAR, KPI.fecha_registro, 23) AS fechaRegistro,
          CONVERT(VARCHAR, KPI.fecha_evaluacion, 23) AS fechaEvaluacion,
          KPI.observaciones,
          KPI.valor_alcanzado,
          CASE
            WHEN KPI.calificacion = 'SIN CALIFICAR' THEN 'SIN CALIFICAR'
            WHEN KPI.calificacion = 'CUMPLIDA' THEN 'CUMPLIDA'
            WHEN KPI.calificacion = 'INCUMPLIDA' THEN 'INCUMPLIDA'
            ELSE 'DESCONOCIDO'
          END AS kpi_calificada,
          C.cronica AS nombreEnfermedad
        FROM REGISTROS_KPIS KPI
          LEFT JOIN CRONICAS C ON KPI.id_enf_cronica = C.id_enf_cronica
          LEFT JOIN KPIs T ON KPI.id_kpi = T.id_kpi
        WHERE KPI.id_registro_kpi = @idRegistro
          AND KPI.clavenomina IS NOT NULL
          AND KPI.clavepaciente IS NOT NULL;
      `;

      inputParams.push({ name: "idRegistro", value: parseInt(idRegistro, 10) });

    //* ----------------------------------------------------------------------------------
    //* Consulta para "clavenomina" y "clavepaciente"
    //* ----------------------------------------------------------------------------------
    } else {
      query = `
        SELECT
          KPI.id_registro_kpi AS idRegistro,
          KPI.id_kpi AS idKPI,
          T.kpi AS nombreKPI,
          KPI.clavenomina,
          KPI.clavepaciente,
          KPI.valor_actual,
          KPI.valor_objetivo,
          KPI.calificacion,
          CONVERT(VARCHAR, KPI.fecha_registro, 23) AS fechaRegistro,
          CONVERT(VARCHAR, KPI.fecha_evaluacion, 23) AS fechaEvaluacion,
          KPI.observaciones,
          KPI.valor_alcanzado,
          CASE
            WHEN KPI.calificacion = 'SIN CALIFICAR' THEN 'SIN CALIFICAR'
            WHEN KPI.calificacion = 'CUMPLIDA' THEN 'CUMPLIDA'
            WHEN KPI.calificacion = 'INCUMPLIDA' THEN 'INCUMPLIDA'
            ELSE 'DESCONOCIDO'
          END AS kpi_calificada,
          C.cronica AS nombreEnfermedad
        FROM REGISTROS_KPIS KPI
          LEFT JOIN CRONICAS C ON KPI.id_enf_cronica = C.id_enf_cronica
          LEFT JOIN KPIs T ON KPI.id_kpi = T.id_kpi
        WHERE KPI.clavenomina = @clavenomina
          AND KPI.clavepaciente = @clavepaciente
          AND KPI.clavenomina IS NOT NULL
          AND KPI.clavepaciente IS NOT NULL
        ORDER BY KPI.fecha_registro DESC;
      `;

      inputParams.push({ name: "clavenomina", value: clavenomina.trim() });
      inputParams.push({ name: "clavepaciente", value: clavepaciente.trim() });
    }

    //* ----------------------------------------------------------------------------------
    //* Ejecutar la consulta con los parámetros
    //* ----------------------------------------------------------------------------------
    const request = pool.request();
    inputParams.forEach((param) => request.input(param.name, param.value));

    const result = await request.query(query);

    // console.log("Consulta ejecutada:", query, "Parámetros:", inputParams);
    // console.log("Resultados obtenidos:", result.recordset);

    if (result.recordset.length === 0) {
      console.warn("Consulta sin resultados para los parámetros:", {
        clavenomina,
        clavepaciente,
        idRegistro,
      });
      return res.status(404).json({ message: "No se encontraron datos" });
    }

    //* Responder con los registros obtenidos
    return res.status(200).json(result.recordset);
  } catch (error) {
    //! Log detallado de errores
    console.error("Error al consultar la base de datos:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Error del servidor", error });
  }
}
