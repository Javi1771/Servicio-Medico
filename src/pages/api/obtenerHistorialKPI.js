import { connectToDatabase } from "./connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavenomina, nombrePaciente, idRegistro } = req.query;

  if (!clavenomina && !idRegistro) {
    return res.status(400).json({ message: "Faltan parámetros requeridos" });
  }

  try {
    const pool = await connectToDatabase();

    let query;
    let inputParams = [];

    if (idRegistro) {
      query = `
        SELECT 
          KPI.id_registro_kpi AS idRegistro,
          KPI.clavenomina,
          KPI.valor_actual,
          KPI.valor_objetivo,
          KPI.calificacion,
          CONVERT(VARCHAR, KPI.fecha_registro, 23) AS fechaRegistro,
          CONVERT(VARCHAR, KPI.fecha_evaluacion, 23) AS fechaEvaluacion,
          KPI.observacion_valuacion AS observacionEvaluacion,
          KPI.observaciones,
          KPI.valor_alcanzado,
          ISNULL(KPI.kpi_calificada, 'No calificada') AS kpi_calificada,
          CAST(KPI.nombre_paciente AS NVARCHAR(MAX)) AS paciente,
          C.cronica AS nombreEnfermedad
        FROM REGISTROS_KPIS KPI
        LEFT JOIN CRONICAS C ON KPI.id_enf_cronica = C.id_enf_cronica
        WHERE KPI.id_registro_kpi = @idRegistro;
      `;
      inputParams.push({ name: "idRegistro", value: parseInt(idRegistro, 10) });
    } else {
      query = `
        SELECT 
          KPI.id_registro_kpi AS idRegistro,
          KPI.clavenomina,
          KPI.valor_actual,
          KPI.valor_objetivo,
          KPI.calificacion,
          CONVERT(VARCHAR, KPI.fecha_registro, 23) AS fechaRegistro,
          CONVERT(VARCHAR, KPI.fecha_evaluacion, 23) AS fechaEvaluacion,
          KPI.observacion_valuacion AS observacionEvaluacion,
          KPI.observaciones,
          KPI.valor_alcanzado,
          ISNULL(KPI.kpi_calificada, 'No calificada') AS kpi_calificada,
          CAST(KPI.nombre_paciente AS NVARCHAR(MAX)) AS paciente,
          C.cronica AS nombreEnfermedad
        FROM REGISTROS_KPIS KPI
        LEFT JOIN CRONICAS C ON KPI.id_enf_cronica = C.id_enf_cronica
        WHERE KPI.clavenomina = @clavenomina
        ${nombrePaciente ? "AND CAST(KPI.nombre_paciente AS NVARCHAR(MAX)) = @nombrePaciente" : ""};
      `;
      inputParams.push({ name: "clavenomina", value: clavenomina.trim() });
      if (nombrePaciente) {
        inputParams.push({
          name: "nombrePaciente",
          value: nombrePaciente.trim(),
        });
      }
    }

    const request = pool.request();
    inputParams.forEach((param) => request.input(param.name, param.value));

    const result = await request.query(query);

    console.log("Parámetros recibidos:", { clavenomina, nombrePaciente });
    console.log("Consulta ejecutada:", query);
    console.log("Resultado de la base de datos:", result.recordset);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontraron datos" });
    }

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    return res.status(500).json({ message: "Error del servidor", error });
  }
}
