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
    noNomina,
    fechaInicial,
    fechaFinal,
    diagnostico,
    nombreMedico,
    nombrePaciente,
    clavepaciente,
  } = req.body;

  if (
    !claveConsulta ||
    !noNomina ||
    !nombreMedico ||
    !nombrePaciente ||
    !clavepaciente
  ) {
    const datosFaltantes = [];
    if (!claveConsulta) datosFaltantes.push("claveConsulta");
    if (!noNomina) datosFaltantes.push("noNomina");
    if (!nombreMedico) datosFaltantes.push("nombreMedico");
    if (!nombrePaciente) datosFaltantes.push("nombrePaciente");
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

    const medicoResult = await pool
      .request()
      .input("nombreMedico", sql.NVarChar, nombreMedico).query(`
        SELECT claveusuario 
        FROM USUARIOS 
        WHERE nombreusuario = @nombreMedico
      `);

    if (medicoResult.recordset.length === 0) {
      return res.status(404).json({ message: "Médico no encontrado." });
    }

    const claveMedico = medicoResult.recordset[0].claveusuario;

    await pool
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("noNomina", sql.NVarChar, noNomina)
      .input("fechaInicial", sql.DateTime, fechaInicialFinal)
      .input("fechaFinal", sql.DateTime, fechaFinalFinal)
      .input("diagnostico", sql.Text, diagnosticoFinal)
      .input("estatus", sql.Int, 1)
      .input("claveMedico", sql.Int, claveMedico)
      .input("nombrePaciente", sql.NText, nombrePaciente)
      .input("clavepaciente", sql.Int, clavepaciente).query(`
        INSERT INTO detalleIncapacidad 
        (claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, estatus, claveMedico, nombrePaciente, clavepaciente)
        VALUES (@claveConsulta, @noNomina, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @claveMedico, @nombrePaciente, @clavepaciente)
      `);

    console.log("Obteniendo historial actualizado...");
    const result = await pool
      .request()
      .input("clavepaciente", sql.Int, clavepaciente).query(`
        SELECT 
          idDetalleIncapacidad,
          claveConsulta,
          fechaInicial,
          fechaFinal,
          diagnostico,
          nombrePaciente,
          clavepaciente
        FROM detalleIncapacidad
        WHERE clavepaciente = @clavepaciente
        ORDER BY idDetalleIncapacidad DESC
      `);

    const historial = result.recordset;

    console.log("Historial actualizado:", historial);

    console.log("Disparando evento Pusher...");
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

    res.status(200).json({
      message: "Incapacidad guardada correctamente y evento emitido.",
      historial,
    });
  } catch (error) {
    console.error("Error al guardar la incapacidad:", error);
    res.status(500).json({ message: "Error al guardar la incapacidad." });
  }
}
