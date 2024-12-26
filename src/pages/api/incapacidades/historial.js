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
    } = req.body;

    if (!clavenomina || !clavepaciente) {
      return res.status(400).json({
        message: "Faltan datos obligatorios: clavenomina y clavepaciente",
      });
    }

    try {
      const pool = await connectToDatabase();

      // Insertar datos en la base de datos
      await pool
        .request()
        .input("clavenomina", sql.NVarChar, clavenomina)
        .input("clavepaciente", sql.NVarChar, clavepaciente)
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("fechaInicial", sql.DateTime, fechaInicial || null)
        .input("fechaFinal", sql.DateTime, fechaFinal || null)
        .input("diagnostico", sql.NVarChar, diagnostico || null)
        .input("estatus", sql.Int, estatus)
        .query(`
          INSERT INTO detalleIncapacidad (
            clavenomina, clavepaciente, claveConsulta,
            fechaInicial, fechaFinal, diagnostico, estatus
          )
          VALUES (
            @clavenomina, @clavepaciente, @claveConsulta,
            @fechaInicial, @fechaFinal, @diagnostico, @estatus
          )
        `);

      // Obtener historial actualizado
      const result = await pool
        .request()
        .input("clavenomina", sql.NVarChar, clavenomina)
        .input("clavepaciente", sql.NVarChar, clavepaciente)
        .query(`
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

      await pusher.trigger("incapacidades-channel", "incapacidades-updated", {
        clavepaciente,
        historial,
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
        message: "Faltan datos obligatorios: clavenomina y clavepaciente",
      });
    }

    try {
      const pool = await connectToDatabase();

      // Consultar historial filtrado
      const result = await pool
        .request()
        .input("clavenomina", sql.NVarChar, clavenomina) // Cambiado a NVarChar
        .input("clavepaciente", sql.NVarChar, clavepaciente) // Cambiado a NVarChar
        .query(`
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
