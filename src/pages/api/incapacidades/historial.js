import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      clavenomina,
      clavepaciente,
      claveConsulta,
      fechaInicial,
      fechaFinal,
      diagnostico,
      estatus,
      nombreMedico,
    } = req.body;

    if (!clavenomina || !clavepaciente || !claveConsulta) {
      return res.status(400).json({
        message: "Faltan datos obligatorios: clavenomina, clavepaciente o claveConsulta",
      });
    }

    try {
      const pool = await connectToDatabase();

      //* Insertando datos en la base de datos
      await pool
        .request()
        .input("clavenomina", sql.Int, clavenomina)
        .input("clavepaciente", sql.Int, clavepaciente)
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("fechaInicial", sql.DateTime, fechaInicial || null)
        .input("fechaFinal", sql.DateTime, fechaFinal || null)
        .input("diagnostico", sql.NVarChar, diagnostico || null)
        .input("estatus", sql.Int, estatus)
        .input("nombreMedico", sql.NVarChar, nombreMedico).query(`
          INSERT INTO detalleIncapacidad 
          (clavenomina, clavepaciente, claveConsulta, fechaInicial, fechaFinal, diagnostico, estatus, nombreMedico)
          VALUES (@clavenomina, @clavepaciente, @claveConsulta, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @nombreMedico)
        `);

      //* Obteniendo historial actualizado
      const result = await pool
        .request()
        .input("clavenomina", sql.Int, clavenomina)
        .input("clavepaciente", sql.Int, clavepaciente).query(`
          SELECT 
            claveConsulta,
            idDetalleIncapacidad,
            ISNULL(diagnostico, 'Sin diagnóstico') AS diagnostico,
            CASE 
              WHEN fechaInicial IS NULL THEN NULL
              ELSE fechaInicial
            END AS fechaInicial,
            CASE 
              WHEN fechaFinal IS NULL THEN NULL
              ELSE fechaFinal
            END AS fechaFinal
          FROM detalleIncapacidad
          WHERE clavenomina = @clavenomina
            AND clavepaciente = @clavepaciente
          ORDER BY idDetalleIncapacidad DESC
        `);

      const historial = result.recordset;

      //* Log para depuración
      console.log("Datos enviados a Pusher:", historial);

      //* Emitiendo evento de Pusher
      await pusher.trigger("incapacidades-channel", "incapacidades-updated", {
        clavepaciente,
        historial: historial.map((item) => ({
          ...item,
          claveConsulta: item.claveConsulta || "Sin clave",
          diagnostico: item.diagnostico || "Sin diagnóstico",
          fechaInicial: item.fechaInicial ? item.fechaInicial.toISOString() : null,
          fechaFinal: item.fechaFinal ? item.fechaFinal.toISOString() : null,
        })),
      });

      return res.status(200).json({
        message: "Incapacidad guardada correctamente",
        historial,
      });
    } catch (error) {
      console.error("Error al guardar incapacidad:", error);
      return res.status(500).json({
        message: "Error al guardar la incapacidad",
        error: error.message,
      });
    }
  } else if (req.method === "GET") {
    const { clavenomina, clavepaciente } = req.query;

    if (!clavenomina || !clavepaciente) {
      return res.status(400).json({
        message: "Faltan datos obligatorios: clavenomina o clavepaciente",
      });
    }

    try {
      const pool = await connectToDatabase();

      const result = await pool
        .request()
        .input("clavenomina", sql.Int, clavenomina)
        .input("clavepaciente", sql.Int, clavepaciente).query(`
          SELECT 
            claveConsulta,
            idDetalleIncapacidad,
            ISNULL(diagnostico, 'Sin diagnóstico') AS diagnostico,
            fechaInicial,
            fechaFinal
          FROM detalleIncapacidad
          WHERE clavenomina = @clavenomina
            AND clavepaciente = @clavepaciente
          ORDER BY idDetalleIncapacidad DESC
        `);

      const historial = result.recordset;

      //* Log para depuración
      console.log("Datos enviados a Pusher (GET):", historial);

      //* Emitiendo evento de Pusher
      await pusher.trigger("incapacidades-channel", "incapacidades-updated", {
        clavepaciente,
        historial,
      });

      return res.status(200).json({ historial });
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return res.status(500).json({
        message: "Error al obtener historial",
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ message: "Método no permitido" });
  }
}
