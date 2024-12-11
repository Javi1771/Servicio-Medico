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
      clavenomina,
      prioridad,
      nombrePaciente,
      clavepaciente,
    } = req.body;

    console.log("Datos recibidos en la solicitud:", {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      nombreMedico,
      clavenomina,
      prioridad,
      nombrePaciente,
      clavepaciente,
    });

    //* Validar datos obligatorios
    if (
      !claveConsulta ||
      !nombreMedico ||
      !clavenomina ||
      !nombrePaciente ||
      !clavepaciente
    ) {
      console.error("Datos incompletos:", {
        claveConsulta,
        claveEspecialidad,
        observaciones,
        nombreMedico,
        clavenomina,
        prioridad,
        nombrePaciente,
        clavepaciente,
      });
      return res.status(400).json({ message: "Datos incompletos." });
    }

    try {
      const pool = await connectToDatabase();

      const estatus = 1;
      const fechaRegistro = new Date().toISOString();

      //* Convertir claveEspecialidad a null si no se asigna
      const claveEspecialidadFinal =
        claveEspecialidad === "N" ? null : claveEspecialidad;

      console.log("Insertando en la tabla detalleEspecialidad...");
      await pool
        .request()
        .input("claveconsulta", sql.Int, claveConsulta)
        .input("clave_nomina", sql.NVarChar, clavenomina)
        .input("nombre_paciente", sql.NVarChar, nombrePaciente)
        .input("claveespecialidad", sql.Int, claveEspecialidadFinal) //! NULL si no hay especialidad
        .input(
          "observaciones",
          sql.Text,
          observaciones ||
            "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta"
        )
        .input("prioridad", sql.NVarChar, prioridad || "N/A")
        .input("estatus", sql.Int, estatus)
        .input("nombre_medico", sql.NVarChar, nombreMedico)
        .input("fecha_asignacion", sql.DateTime, fechaRegistro)
        .input("clavepaciente", sql.Int, clavepaciente).query(`
          INSERT INTO detalleEspecialidad 
          (claveconsulta, clave_nomina, nombre_paciente, claveespecialidad, observaciones, prioridad, estatus, nombre_medico, fecha_asignacion, clavepaciente)
          VALUES 
          (@claveconsulta, @clave_nomina, @nombre_paciente, @claveespecialidad, @observaciones, @prioridad, @estatus, @nombre_medico, @fecha_asignacion, @clavepaciente)
        `);

      console.log("Actualizando la tabla consultas...");
      await pool
        .request()
        .input("claveconsulta", sql.Int, claveConsulta)
        .input("claveespecialidad", sql.Int, claveEspecialidadFinal) //! NULL si no hay especialidad
        .input(
          "seasignoaespecialidad",
          sql.NVarChar,
          claveEspecialidadFinal ? "S" : "N"
        ).query(`
          UPDATE consultas
          SET 
            seasignoaespecialidad = @seasignoaespecialidad,
            especialidadinterconsulta = @claveespecialidad
          WHERE claveconsulta = @claveconsulta;
        `);

      console.log("Obteniendo historial actualizado...");
      const result = await pool
        .request()
        .input("clave_nomina", sql.NVarChar, clavenomina)
        .input("nombre_paciente", sql.NVarChar, nombrePaciente).query(`
          SELECT 
            d.claveconsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            d.nombre_medico,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion,
            d.clavepaciente
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE 
            d.clave_nomina = @clave_nomina
            AND d.nombre_paciente = @nombre_paciente
            AND d.fecha_asignacion >= DATEADD(MONTH, -1, GETDATE()) 
          ORDER BY d.fecha_asignacion DESC
        `);

      const historial = result.recordset;

      console.log("Historial filtrado al último mes:", historial);

      console.log("Disparando evento Pusher...");
      await pusher.trigger("especialidades-channel", "especialidades-updated", {
        clavepaciente,
        historial, // Asegúrate de que este objeto esté completo
      });
      

      res.status(200).json({
        message: "Especialidad guardada correctamente y evento emitido.",
        historial,
      });
    } catch (error) {
      console.error("Error al guardar la especialidad:", error);
      res.status(500).json({ message: "Error al guardar la especialidad." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
