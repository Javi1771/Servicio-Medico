import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, nombreMedico, nombrePaciente } = req.body;

  if (!claveConsulta || !noNomina || !fechaInicial || !fechaFinal || !diagnostico || !nombreMedico || !nombrePaciente) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    const pool = await connectToDatabase();

    //* Buscar claveusuario basado en nombreMedico
    const medicoResult = await pool
      .request()
      .input("nombreMedico", sql.NVarChar, nombreMedico)
      .query(`
        SELECT claveusuario 
        FROM USUARIOS 
        WHERE nombreusuario = @nombreMedico
      `);

    if (medicoResult.recordset.length === 0) {
      return res.status(404).json({ message: "Médico no encontrado." });
    }

    const claveMedico = medicoResult.recordset[0].claveusuario;

    //* Insertar en la tabla detalleIncapacidad
    await pool
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("noNomina", sql.NVarChar, noNomina)
      .input("fechaInicial", sql.DateTime, fechaInicial)
      .input("fechaFinal", sql.DateTime, fechaFinal)
      .input("diagnostico", sql.Text, diagnostico)
      .input("estatus", sql.Int, 1) 
      .input("claveMedico", sql.Int, claveMedico)
      .input("nombrepaciente", sql.NText, nombrePaciente)
      .query(`
        INSERT INTO detalleIncapacidad 
        (claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, estatus, claveMedico, nombrePaciente)
        VALUES (@claveConsulta, @noNomina, @fechaInicial, @fechaFinal, @diagnostico, @estatus, @claveMedico, @nombrepaciente)
      `);

    res.status(200).json({ message: "Incapacidad guardada correctamente." });
  } catch (error) {
    console.error("Error al guardar la incapacidad:", error);
    res.status(500).json({ message: "Error al guardar la incapacidad." });
  }
}
