import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    claveConsulta,
    claveEspecialidad,
    observaciones,
    nombreMedico,
    numeroDeNomina,
    nombrePaciente,
  } = req.body;

  // Log de los datos recibidos
  console.log("Datos recibidos en el backend:", req.body);

  if (
    !claveConsulta ||
    !claveEspecialidad ||
    !observaciones ||
    !nombreMedico ||
    !numeroDeNomina ||
    !nombrePaciente
  ) {
    console.error("Faltan datos obligatorios:", {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      nombreMedico: nombreMedico || "No definido",
      numeroDeNomina: numeroDeNomina || "No definido",
      nombrePaciente: nombrePaciente || "No definido",
    });
    return res.status(400).json({ message: "Datos incompletos." });
  }

  try {
    const pool = await connectToDatabase();

    const estatus = 1;

    // Inserción en la tabla detalleEspecialidad
    await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .input("clave_nomina", sql.NVarChar, numeroDeNomina)
      .input("nombre_paciente", sql.NVarChar, nombrePaciente)
      .input("claveespecialidad", sql.Int, claveEspecialidad)
      .input("observaciones", sql.Text, observaciones)
      .input("estatus", sql.Int, estatus)
      .input("nombre_medico", sql.NVarChar, nombreMedico)
      .query(`
        INSERT INTO detalleEspecialidad 
        (claveconsulta, clave_nomina, nombre_paciente, claveespecialidad, observaciones, estatus, nombre_medico)
        VALUES 
        (@claveconsulta, @clave_nomina, @nombre_paciente, @claveespecialidad, @observaciones, @estatus, @nombre_medico)
      `);

    console.log("Inserción en detalleEspecialidad completada.");
    res.status(200).json({ message: "Especialidad guardada correctamente." });
  } catch (error) {
    console.error("Error al guardar la especialidad:", error);
    res.status(500).json({ message: "Error al guardar la especialidad." });
  }
}
