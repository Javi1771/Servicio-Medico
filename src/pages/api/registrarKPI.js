import { connectToDatabase } from "./connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    id_enf_cronica,
    clavenomina,
    nombrePaciente,
    valor_actual,
    valor_objetivo,
    calificacion,
    observaciones,
    valor_alcanzado,
  } = req.body;

  //* Registro detallado de cada campo recibido
  console.log("Datos recibidos en el servidor:");
  console.log("id_enf_cronica:", id_enf_cronica);
  console.log("clavenomina:", clavenomina);
  console.log("nombrePaciente:", nombrePaciente); 
  console.log("valor_actual:", valor_actual);
  console.log("valor_objetivo:", valor_objetivo);
  console.log("calificacion:", calificacion);
  console.log("observaciones:", observaciones);
  console.log("valor_alcanzado:", valor_alcanzado);

  //* Verificar que los datos obligatorios estén presentes
  if (
    !id_enf_cronica ||
    !clavenomina ||
    !nombrePaciente || 
    valor_actual === undefined ||
    valor_objetivo === undefined
  ) {
    console.error("Error: Faltan datos obligatorios", {
      id_enf_cronica,
      clavenomina,
      nombrePaciente,
      valor_actual,
      valor_objetivo,
    });
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      INSERT INTO REGISTROS_KPIS (clavenomina, nombre_paciente, valor_actual, valor_objetivo, calificacion, fecha_registro, observaciones, id_enf_cronica, valor_alcanzado)
      VALUES (@clavenomina, @nombre_paciente, @valor_actual, @valor_objetivo, @calificacion, GETDATE(), @observaciones, @id_enf_cronica, @valor_alcanzado)
    `;

    await pool
      .request()
      .input("id_enf_cronica", id_enf_cronica)
      .input("nombre_paciente", nombrePaciente)
      .input("clavenomina", clavenomina)
      .input("valor_actual", valor_actual)
      .input("valor_objetivo", valor_objetivo)
      .input("calificacion", calificacion)
      .input("observaciones", observaciones)
      .input("valor_alcanzado", valor_alcanzado)
      .query(query);

    res.status(201).json({ message: "KPI registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar KPI en la base de datos:", error);
    res.status(500).json({ message: "Error al registrar KPI", error });
  }
}