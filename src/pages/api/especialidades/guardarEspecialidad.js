import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      clavenomina,
      prioridad,
      clavepaciente,
    } = req.body;

    console.log("Datos recibidos en la solicitud:", {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      clavenomina,
      prioridad,
      clavepaciente,
    });

    //* Validar datos obligatorios
    if (!claveConsulta || !clavenomina || !clavepaciente) {
      console.error("Datos incompletos:", {
        claveConsulta,
        claveEspecialidad,
        observaciones,
        clavenomina,
        prioridad,
        clavepaciente,
      });
      return res.status(400).json({ message: "Datos incompletos." });
    }

    try {
      const pool = await connectToDatabase();

      const fechaRegistro = new Date().toISOString();
      const claveEspecialidadFinal =
        claveEspecialidad === "N" ? null : claveEspecialidad;

      //* Determinar el valor real de observaciones
      const observacionesFinal =
        observaciones ||
        "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta";

      //* Lógica para determinar el estatus
      //! Si no se asigna especialidad (N => claveEspecialidadFinal = null)
      //! y las observaciones son las por defecto (o no se dan), estatus = 0
      //! Si no, estatus = 1
      let estatus = 1;
      if (!claveEspecialidadFinal && observacionesFinal === "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta") {
        estatus = 0;
      }

      console.log("Insertando en la tabla detalleEspecialidad...");
      await pool
        .request()
        .input("claveconsulta", sql.Int, parseInt(claveConsulta, 10))  
        .input("clavenomina", sql.VarChar, clavenomina)                
        .input(
          "claveespecialidad",
          sql.Int,
          claveEspecialidadFinal ? parseInt(claveEspecialidadFinal, 10) : null
        )
        .input("observaciones", sql.NVarChar, observacionesFinal)
        .input("prioridad", sql.VarChar, prioridad || "N/A")
        .input("estatus", sql.Int, estatus)
        .input("fecha_asignacion", sql.DateTime, fechaRegistro)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .query(`
          INSERT INTO detalleEspecialidad 
          (claveconsulta, clavenomina, claveespecialidad, observaciones, prioridad, estatus, fecha_asignacion, clavepaciente)
          VALUES 
          (@claveconsulta, @clavenomina, @claveespecialidad, @observaciones, @prioridad, @estatus, @fecha_asignacion, @clavepaciente)
        `);

      console.log("Actualizando la tabla consultas...");
      await pool
        .request()
        .input("claveconsulta", sql.Int, parseInt(claveConsulta, 10)) 
        .input(
          "claveespecialidad",
          sql.Int,
          claveEspecialidadFinal ? parseInt(claveEspecialidadFinal, 10) : null
        )
        .input(
          "seasignoaespecialidad",
          sql.VarChar,
          claveEspecialidadFinal ? "S" : "N"
        )
        .query(`
          UPDATE consultas
          SET 
            seasignoaespecialidad = @seasignoaespecialidad
          WHERE claveconsulta = @claveconsulta;
        `);

      console.log("Obteniendo historial actualizado...");
      const result = await pool
        .request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .query(`
          SELECT 
            d.claveconsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion,
            d.clavepaciente
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE 
            d.clavenomina = @clavenomina
            AND d.fecha_asignacion >= DATEADD(MONTH, -1, GETDATE()) 
          ORDER BY d.fecha_asignacion DESC
        `);

      const historial = result.recordset;

      console.log("Historial filtrado al último mes:", historial);

      console.log("Disparando evento Pusher...");
      await pusher.trigger("especialidades-channel", "especialidades-updated", {
        clavepaciente,
        historial,
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
