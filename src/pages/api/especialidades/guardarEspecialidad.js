import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      nombreMedico,
      numeroDeNomina,
      prioridad,
      nombrePaciente,
    } = req.body;

    if (
      !claveConsulta ||
      !claveEspecialidad ||
      !observaciones ||
      !prioridad ||
      !nombreMedico ||
      !numeroDeNomina ||
      !nombrePaciente
    ) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    try {
      const pool = await connectToDatabase();

      const estatus = 1;
      const fechaRegistro = new Date().toISOString(); // Fecha en formato ISO

      await pool
        .request()
        .input("claveconsulta", sql.Int, claveConsulta)
        .input("clave_nomina", sql.NVarChar, numeroDeNomina)
        .input("nombre_paciente", sql.NVarChar, nombrePaciente)
        .input("claveespecialidad", sql.Int, claveEspecialidad)
        .input("observaciones", sql.Text, observaciones)
        .input("prioridad", sql.NVarChar, prioridad)
        .input("estatus", sql.Int, estatus)
        .input("nombre_medico", sql.NVarChar, nombreMedico)
        .input("fecha_asignacion", sql.DateTime, fechaRegistro) // Fecha de asignación
        .query(`
          INSERT INTO detalleEspecialidad 
          (claveconsulta, clave_nomina, nombre_paciente, claveespecialidad, observaciones, prioridad, estatus, nombre_medico, fecha_asignacion)
          VALUES 
          (@claveconsulta, @clave_nomina, @nombre_paciente, @claveespecialidad, @observaciones, @prioridad, @estatus, @nombre_medico, @fecha_asignacion)
        `);

      res.status(200).json({ message: "Especialidad guardada correctamente." });
    } catch (error) {
      console.error("Error al guardar la especialidad:", error);
      res.status(500).json({ message: "Error al guardar la especialidad." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
