import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    id_registro_kpi,
    valor_alcanzado,
    calificacion,
    observacion_valuacion,
    fecha_evaluacion,
  } = req.body;

  // Log para verificar los datos recibidos en el backend
  console.log("Datos recibidos en el backend:", {
    id_registro_kpi,
    valor_alcanzado,
    calificacion,
    observacion_valuacion,
    fecha_evaluacion,
  });

  //* Validar datos requeridos
  if (
    !id_registro_kpi ||
    valor_alcanzado === undefined ||
    calificacion === undefined ||
    !fecha_evaluacion
  ) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
      datos_recibidos: {
        id_registro_kpi,
        valor_alcanzado,
        calificacion,
        observacion_valuacion,
        fecha_evaluacion,
      },
    });
  }

  try {
    const pool = await connectToDatabase();

    // Construir consulta para actualizar datos del KPI
    const query = `
      UPDATE REGISTROS_KPIS
      SET valor_alcanzado = @valor_alcanzado,
          calificacion = @calificacion,
          observacion_valuacion = @observacion_valuacion,
          fecha_evaluacion = @fecha_evaluacion,
          kpi_calificada = 'Calificada'
      WHERE id_registro_kpi = @id_registro_kpi
    `;

    console.log("Ejecutando consulta SQL con datos:");
    console.log({
      id_registro_kpi,
      valor_alcanzado,
      calificacion,
      observacion_valuacion,
      fecha_evaluacion,
    });

    const result = await pool
      .request()
      .input("valor_alcanzado", valor_alcanzado)
      .input("calificacion", calificacion)
      .input("observacion_valuacion", observacion_valuacion)
      .input("fecha_evaluacion", fecha_evaluacion)
      .input("id_registro_kpi", id_registro_kpi)
      .query(query);

    // Validar si se actualizó algún registro
    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró el KPI especificado." });
    }

    res.status(200).json({ message: "KPI actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar KPI:", error);
    res.status(500).json({ message: "Error interno del servidor.", error });
  }
}
