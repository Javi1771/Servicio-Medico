import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // Obtener los datos del cuerpo de la solicitud
  const {
    id_enf_cronica,
    clavenomina,
    observaciones_cronica,
    fecha_registro,
    nombre_paciente
  } = req.body;

  // Mostrar en consola los datos recibidos para depuración
  console.log("Datos recibidos en el servidor:", {
    id_enf_cronica,
    clavenomina,
    observaciones_cronica,
    fecha_registro,
    nombre_paciente,
  });

  // Validación de datos requeridos con mensajes específicos de error para cada campo
  if (!id_enf_cronica) {
    console.error("Error: id_enf_cronica es obligatorio");
    return res.status(400).json({ message: 'El campo id_enf_cronica es obligatorio' });
  }
  if (!clavenomina) {
    console.error("Error: clavenomina es obligatorio");
    return res.status(400).json({ message: 'El campo clavenomina es obligatorio' });
  }
  if (!observaciones_cronica) {
    console.error("Error: observaciones_cronica es obligatorio");
    return res.status(400).json({ message: 'El campo observaciones_cronica es obligatorio' });
  }
  if (!fecha_registro) {
    console.error("Error: fecha_registro es obligatorio");
    return res.status(400).json({ message: 'El campo fecha_registro es obligatorio' });
  }
  if (!nombre_paciente) {
    console.error("Error: nombre_paciente es obligatorio");
    return res.status(400).json({ message: 'El campo nombre_paciente es obligatorio' });
  }

  try {
    // Conectar a la base de datos y ejecutar la consulta
    const pool = await connectToDatabase();
    const query = `
      INSERT INTO Registro_Enfermedades_Cronicas (id_enf_cronica, clavenomina, observaciones_cronica, fecha_registro, nombre_paciente)
      VALUES (@id_enf_cronica, @clavenomina, @observaciones_cronica, @fecha_registro, @nombre_paciente)
    `;

    // Ejecutar la consulta y pasar los parámetros
    await pool.request()
      .input('id_enf_cronica', id_enf_cronica)
      .input('clavenomina', clavenomina)
      .input('observaciones_cronica', observaciones_cronica)
      .input('fecha_registro', fecha_registro)
      .input('nombre_paciente', nombre_paciente)
      .query(query);

    res.status(201).json({ message: 'Enfermedad crónica registrada exitosamente' });
  } catch (error) {
    console.error("Error al registrar enfermedad crónica en la base de datos:", error);
    res.status(500).json({ message: 'Error al registrar enfermedad crónica', error });
  }
}
