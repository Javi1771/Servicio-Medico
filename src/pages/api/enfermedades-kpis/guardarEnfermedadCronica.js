import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const {
    id_enf_cronica,
    clavenomina,
    observaciones_cronica,
    fecha_registro,
    clavepaciente
  } = req.body;

  //* Log para verificar los datos recibidos
  console.log("Datos recibidos en el servidor al guardar enfermedad crónica:", {
    id_enf_cronica,
    clavenomina,
    observaciones_cronica,
    fecha_registro,
    clavepaciente
  });

  //* Validación de datos requeridos
  if (!id_enf_cronica || !clavenomina || !observaciones_cronica || !fecha_registro) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      INSERT INTO PACIENTES_CRONICOS
      (id_enf_cronica, clavenomina, observaciones_cronica, fecha_registro, clavepaciente, estatus)
      VALUES (@id_enf_cronica, @clavenomina, @observaciones_cronica, @fecha_registro, @clavepaciente, @estatus)
    `;

    await pool.request()
      .input('id_enf_cronica', id_enf_cronica)
      .input('clavenomina', clavenomina)
      .input('observaciones_cronica', observaciones_cronica)
      .input('fecha_registro', fecha_registro)
      .input('clavepaciente', clavepaciente)
      .input('estatus', 1) //* Siempre insertar un 1 en la columna 'estatus'
      .query(query);

    res.status(201).json({ message: 'Enfermedad crónica registrada exitosamente' });
  } catch (error) {
    console.error("Error al registrar enfermedad crónica en la base de datos:", error);
    res.status(500).json({ message: 'Error al registrar enfermedad crónica', error });
  }
}
