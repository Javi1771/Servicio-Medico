import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      prioridad,
      clavepaciente,
    } = req.body;

    if (!claveConsulta || !clavepaciente) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    try {
      const pool = await connectToDatabase();
      const estatus = 1;
      const fechaRegistro = new Date().toISOString();
      const claveEspecialidadFinal =
        claveEspecialidad === "N" ? null : claveEspecialidad;

      await pool
        .request()
        .input("claveconsulta", sql.Int, claveConsulta)
        .input("claveespecialidad", sql.Int, claveEspecialidadFinal)
        .input("observaciones", sql.Text, observaciones || "Sin Observaciones")
        .input("prioridad", sql.NVarChar, prioridad || "N/A")
        .input("estatus", sql.Int, estatus)
        .input("fecha_asignacion", sql.DateTime, fechaRegistro)
        .input("clavepaciente", sql.Int, clavepaciente).query(`
          INSERT INTO detalleEspecialidad 
          (claveconsulta, claveespecialidad, observaciones, prioridad, estatus, fecha_asignacion, clavepaciente)
          VALUES 
          (@claveconsulta, @claveespecialidad, @observaciones, @prioridad, @estatus, @fecha_asignacion, @clavepaciente)
        `);

      await pool
        .request()
        .input("claveconsulta", sql.Int, claveConsulta)
        .input("claveespecialidad", sql.Int, claveEspecialidadFinal)
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

      const result = await pool
        .request()
        .input("clavepaciente", sql.Int, clavepaciente).query(`
          SELECT 
            d.claveconsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE 
            d.clavepaciente = @clavepaciente
          ORDER BY d.fecha_asignacion DESC
        `);

      const historial = result.recordset;

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
