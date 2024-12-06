import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher"; 
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

      // Guardar en la base de datos
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

      // Obtener el historial actualizado
      const result = await pool
        .request()
        .input("clave_nomina", sql.NVarChar, numeroDeNomina)
        .input("nombre_paciente", sql.NVarChar, nombrePaciente)
        .query(`
          SELECT 
            d.claveconsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE 
            d.clave_nomina = @clave_nomina
            AND d.nombre_paciente = @nombre_paciente
          ORDER BY d.fecha_asignacion DESC
        `);

      const historial = result.recordset;

      // Emitir el evento de Pusher
      console.log("Disparando evento historial-updated con datos:", {
        noNomina: numeroDeNomina,
        nombrePaciente,
        historial,
      });

      await pusher.trigger("historial-channel", "historial-updated", {
        noNomina: numeroDeNomina,
        nombrePaciente,
        historial,
      });

      res.status(200).json({ message: "Especialidad guardada correctamente y evento emitido.", historial });
    } catch (error) {
      console.error("Error al guardar la especialidad:", error);
      res.status(500).json({ message: "Error al guardar la especialidad." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
