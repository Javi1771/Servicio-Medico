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

  //* Validar campos obligatorios
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

  //* Determinar el valor de seAsignoIncapacidad
  const seAsignoIncapacidad = 
    diagnosticoFinal === "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta"
      ? 0
      : 1;

  let transaction;

  try {
    const pool = await connectToDatabase();

    //? Iniciar una transacción
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    console.log("Transacción iniciada.");

    //* Insertar en la tabla detalleIncapacidad
    await transaction
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
        (claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, estatus, clavepaciente)
        VALUES (@claveConsulta, @clavenomina, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @clavepaciente)
      `);

    console.log("Incapacidad guardada exitosamente en la base de datos.");

    //* Actualizar la tabla consultas
    await transaction
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("seAsignoIncapacidad", sql.Int, seAsignoIncapacidad)
      .query(`
        UPDATE consultas
        SET seAsignoIncapacidad = @seAsignoIncapacidad
        WHERE claveConsulta = @claveConsulta
      `);

    console.log(
      `Columna seAsignoIncapacidad actualizada correctamente con el valor: ${seAsignoIncapacidad}`
    );

    //* Confirmar la transacción
    await transaction.commit();
    console.log("Transacción confirmada.");

    res.status(200).json({
      message: "Datos guardados correctamente.",
    });
  } catch (error) {
    console.error("Error al guardar los datos:", error);

    //! Revertir la transacción si ocurrió un error
    if (transaction) {
      await transaction.rollback();
      console.log("Transacción revertida debido a un error.");
    }

    res.status(500).json({ message: "Error al guardar los datos." });
  }
}
