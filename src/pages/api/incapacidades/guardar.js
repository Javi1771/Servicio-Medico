import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  console.log("Datos recibidos en el backend:", req.body);

  const {
    claveConsulta,
    clavenomina,
    fechaInicial,
    fechaFinal,
    diagnostico,
    clavepaciente,
  } = req.body;

  if (!clavenomina || !clavepaciente) {
    const datosFaltantes = [];
    if (!clavenomina) datosFaltantes.push("clavenomina");
    if (!clavepaciente) datosFaltantes.push("clavepaciente");

    console.error("Faltan datos obligatorios:", datosFaltantes);
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios.", datosFaltantes });
  }

  const fechaInicialFinal = fechaInicial || null;
  const fechaFinalFinal = fechaFinal || null;
  const diagnosticoFinal =
    diagnostico ||
    "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta";

  try {
    const pool = await connectToDatabase();

    // Inserción de la incapacidad
    const insertQuery = `
      INSERT INTO detalleIncapacidad 
      (claveConsulta, clavenomina, fechaInicial, fechaFinal, diagnostico, estatus, clavepaciente)
      VALUES (@claveConsulta, @clavenomina, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @clavepaciente)
    `;
    await pool
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)     // claveConsulta asume que es numérico en la BD
      .input("clavenomina", sql.VarChar, clavenomina)     // clavenomina alfanumérico -> VarChar
      .input("fechaInicial", sql.DateTime, fechaInicialFinal)
      .input("fechaFinal", sql.DateTime, fechaFinalFinal)
      .input("diagnostico", sql.Text, diagnosticoFinal)
      .input("estatus", sql.Int, 1) // 1: Activo
      .input("clavepaciente", sql.VarChar, clavepaciente) // clavepaciente alfanumérico -> VarChar
      .query(insertQuery);

    console.log("Incapacidad guardada exitosamente en la base de datos");

    // Obtener el historial actualizado
    const queryHistorial = `
      SELECT 
        idDetalleIncapacidad,
        claveConsulta,
        fechaInicial,
        fechaFinal,
        diagnostico,
        clavepaciente
      FROM detalleIncapacidad
      WHERE clavenomina = @clavenomina
        AND clavepaciente = @clavepaciente
      ORDER BY idDetalleIncapacidad DESC
    `;
    const result = await pool
      .request()
      .input("clavenomina", sql.VarChar, clavenomina)
      .input("clavepaciente", sql.VarChar, clavepaciente)
      .query(queryHistorial);

    const historial = result.recordset;

    console.log("Historial actualizado:", historial);

    // Emitir evento Pusher
    console.log("Disparando evento Pusher...");
    await pusher.trigger("incapacidades-channel", "incapacidades-updated", {
      clavepaciente,
      historial: historial.map((item) => ({
        ...item,
        claveConsulta: item.claveConsulta || "Sin clave",
        diagnostico: item.diagnostico || "Sin diagnóstico",
        fechaInicial: item.fechaInicial
          ? item.fechaInicial.toISOString()
          : null,
        fechaFinal: item.fechaFinal ? item.fechaFinal.toISOString() : null,
      })),
    });

    res.status(200).json({
      message: "Incapacidad guardada correctamente y evento emitido.",
      historial,
    });
  } catch (error) {
    console.error("Error al guardar la incapacidad:", error);
    res.status(500).json({ message: "Error al guardar la incapacidad." });
  }
}
