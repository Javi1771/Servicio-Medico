import { connectToDatabase } from "../connectToDatabase";
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

    //* Guardar en la base de datos
    await pool
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("clavenomina", sql.VarChar, clavenomina)
      .input("fechaInicial", sql.DateTime, fechaInicialFinal)
      .input("fechaFinal", sql.DateTime, fechaFinalFinal)
      .input("diagnostico", sql.Text, diagnosticoFinal)
      .input("estatus", sql.Int, 1) // 1: Activo
      .input("clavepaciente", sql.VarChar, clavepaciente)
      .query(`
        INSERT INTO detalleIncapacidad 
        (claveConsulta, clavenomina, fechaInicial, fechaFinal, diagnostico, estatus, clavepaciente)
        VALUES (@claveConsulta, @clavenomina, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @clavepaciente)
      `);

    console.log("Incapacidad guardada exitosamente en la base de datos.");

    res.status(200).json({
      message: "Datos guardados correctamente.",
    });
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    res.status(500).json({ message: "Error al guardar los datos." });
  }
}
