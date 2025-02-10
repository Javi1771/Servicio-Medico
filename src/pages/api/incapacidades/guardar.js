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

  //* Obtener la cookie 'claveusuario'
  const cookies = req.headers.cookie || "";
  const claveusuarioMatch = cookies.match(/claveusuario=([^;]+)/);
  const claveMedico = claveusuarioMatch ? claveusuarioMatch[1] : null;

  if (!clavenomina || !clavepaciente) {
    const datosFaltantes = [];
    if (!clavenomina) datosFaltantes.push("clavenomina");
    if (!clavepaciente) datosFaltantes.push("clavepaciente");

    console.error("Faltan datos obligatorios:", datosFaltantes);
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios.", datosFaltantes });
  }

  //* Las fechas se reciben como cadenas en el formato: 
  //* "2025-02-05 00:00:00.000" y "2025-02-20 23:59:59.999"
  //* Para que SQL Server las convierta correctamente, convertimos el espacio en "T"
  const fechaInicialISO = fechaInicial ? fechaInicial.replace(" ", "T") : null;
  const fechaFinalISO = fechaFinal ? fechaFinal.replace(" ", "T") : null;

  const diagnosticoFinal =
    diagnostico ||
    "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta";

  const seAsignoIncapacidad =
    diagnosticoFinal === "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta" ? 0 : 1;

  const estatus =
    diagnosticoFinal === "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta" ? 2 : 1;

  let transaction;

  try {
    const pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    console.log("Transacción iniciada.");

    await transaction
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("clavenomina", sql.VarChar, clavenomina)
      //* Pasamos las fechas como cadenas y las convertimos en el query a datetime2(7)
      .input("fechaInicial", sql.VarChar, fechaInicialISO)
      .input("fechaFinal", sql.VarChar, fechaFinalISO)
      .input("diagnostico", sql.Text, diagnosticoFinal)
      .input("estatus", sql.Int, estatus)
      .input("clavepaciente", sql.VarChar, clavepaciente)
      .input("claveMedico", sql.VarChar, claveMedico)
      .query(`
        INSERT INTO detalleIncapacidad 
          (claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, estatus, clavepaciente, claveMedico)
        VALUES (
          @claveConsulta, 
          @clavenomina, 
          CONVERT(datetime2(7), @fechaInicial, 126), 
          CONVERT(datetime2(7), @fechaFinal, 126), 
          @diagnostico, 
          @estatus, 
          @clavepaciente, 
          @claveMedico
        )
      `);

    console.log(`Incapacidad guardada exitosamente en la base de datos con estatus: ${estatus}`);

    await transaction
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("seAsignoIncapacidad", sql.Int, seAsignoIncapacidad)
      .query(`
        UPDATE consultas
        SET seAsignoIncapacidad = @seAsignoIncapacidad
        WHERE claveConsulta = @claveConsulta
      `);

    console.log(`Columna seAsignoIncapacidad actualizada correctamente con el valor: ${seAsignoIncapacidad}`);

    await transaction.commit();
    console.log("Transacción confirmada.");

    res.status(200).json({ message: "Datos guardados correctamente." });
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    if (transaction) {
      await transaction.rollback();
      console.log("Transacción revertida debido a un error.");
    }
    res.status(500).json({ message: "Error al guardar los datos." });
  }
}
