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
  console.log("Datos recibidos en el backend:", {
    claveConsulta,
    claveEspecialidad,
    observaciones,
    nombreMedico,
    numeroDeNomina,
    nombrePaciente,
  });

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

    const especialidadQuery = await pool
      .request()
      .input("claveEspecialidad", sql.Int, claveEspecialidad).query(`
        SELECT especialidad 
        FROM especialidades 
        WHERE claveespecialidad = @claveEspecialidad
      `);

    if (!especialidadQuery.recordset.length) {
      console.error(
        "No se encontró especialidad para la clave proporcionada:",
        claveEspecialidad
      );
      return res
        .status(400)
        .json({
          message: "Especialidad no encontrada para la clave proporcionada.",
        });
    }

    const especialidadTexto = especialidadQuery.recordset[0]?.especialidad;
    console.log("Especialidad obtenida:", especialidadTexto);

    await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .input("claveespecialidad", sql.Int, claveEspecialidad)
      .input("observaciones", sql.Text, observaciones)
      .input("estatus", sql.Int, estatus)
      .input("nombreMedico", sql.NVarChar, nombreMedico)
      .input("numeroDeNomina", sql.NVarChar, numeroDeNomina)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .input("especialidad", sql.NVarChar, especialidadTexto).query(`
        INSERT INTO detalleEspecialidad 
        (claveconsulta, claveespecialidad, observaciones, estatus, nombre_medico, clave_nomina, nombre_paciente, especialidad)
        VALUES 
        (@claveconsulta, @claveespecialidad, @observaciones, @estatus, @nombreMedico, @numeroDeNomina, @nombrePaciente, @especialidad)
      `);

    console.log("Inserción en detalleEspecialidad completada.");

    await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .input("claveEspecialidad", sql.Int, claveEspecialidad).query(`
        UPDATE consultas
        SET especialidadinterconsulta = @claveEspecialidad
        WHERE claveconsulta = @claveconsulta
      `);

    console.log("Actualización en consultas completada.");
    res.status(200).json({ message: "Especialidad guardada correctamente." });
  } catch (error) {
    console.error("Error al guardar la especialidad:", error);
    res.status(500).json({ message: "Error al guardar la especialidad." });
  }
}
