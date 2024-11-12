import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const {
    id_kpi,
    clavenomina,
    clavepaciente,
    valor_actual,
    valor_objetivo,
    clave_registro,
    calificacion,
    clave_evaluo,
    fecha_registro,
    fecha_evaluacion,
    observaciones,
    id_enf_cronica,
    valor_alcanzado
  } = req.body;

  // Validación de datos requeridos
  if (!id_kpi || !clavenomina || !valor_actual || !valor_objetivo || !fecha_registro) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      INSERT INTO REGISTROS_KPIS (
        id_kpi, clavenomina, clavepaciente, valor_actual, valor_objetivo,
        clave_registro, calificacion, clave_evaluo, fecha_registro,
        fecha_evaluacion, observaciones, id_enf_cronica, valor_alcanzado
      )
      VALUES (
        @id_kpi, @clavenomina, @clavepaciente, @valor_actual, @valor_objetivo,
        @clave_registro, @calificacion, @clave_evaluo, @fecha_registro,
        @fecha_evaluacion, @observaciones, @id_enf_cronica, @valor_alcanzado
      )
    `;

    // Ejecutar la consulta con parámetros
    await pool.request()
      .input('id_kpi', id_kpi)
      .input('clavenomina', clavenomina)
      .input('clavepaciente', clavepaciente)
      .input('valor_actual', valor_actual)
      .input('valor_objetivo', valor_objetivo)
      .input('clave_registro', clave_registro)
      .input('calificacion', calificacion)
      .input('clave_evaluo', clave_evaluo)
      .input('fecha_registro', fecha_registro)
      .input('fecha_evaluacion', fecha_evaluacion)
      .input('observaciones', observaciones)
      .input('id_enf_cronica', id_enf_cronica)
      .input('valor_alcanzado', valor_alcanzado)
      .query(query);

    res.status(201).json({ message: 'KPI registrado exitosamente' });
  } catch (error) {
    console.error("Error al registrar KPI:", error);
    res.status(500).json({ message: 'Error al registrar KPI', error });
  }
}
