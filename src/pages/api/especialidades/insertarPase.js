import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log("❌ Método no permitido:", req.method);
    return res.status(405).json({ error: "Método no permitido" });
  }

  const {
    clavenomina,
    clavepaciente,
    nombrepaciente,
    edad,
    claveespecialidad,
    claveproveedor,
    costo,
    fechacita,
    sindicato,
    clavestatus = 2,
    elpacienteesempleado,
    parentesco,
    departamento,
    folio,
  } = req.body;

  //* Obtener claveusuario desde la cookie
  const cookieHeader = req.headers.cookie || "";
  const claveusuario = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("claveusuario="))
    ?.split("=")[1];

  if (!claveusuario) {
    console.error("❌ No se encontró 'claveusuario' en las cookies.");
    return res
      .status(400)
      .json({ error: "Falta 'claveusuario' en las cookies." });
  }

  console.log("📥 Datos iniciales recibidos en el body:", {
    clavenomina,
    clavepaciente,
    nombrepaciente,
    edad,
    claveespecialidad,
    claveproveedor,
    costo,
    fechacita,
    sindicato,
    clavestatus,
    elpacienteesempleado,
    parentesco,
    departamento,
    folio,
    claveusuario,
  });

  if (!clavenomina || !clavepaciente || !claveespecialidad || !folio) {
    console.error("❌ Faltan datos obligatorios para la inserción.");
    return res.status(400).json({ error: "Datos incompletos." });
  }

  try {
    const pool = await connectToDatabase();
    console.log("✅ Conexión a la base de datos establecida");

    // **Inserción en la tabla consultas**
    console.log("📄 Preparando query de inserción en consultas...");
    const insertQuery = `
      INSERT INTO consultas (
        clavenomina, clavepaciente, nombrepaciente, edad, especialidadinterconsulta, claveproveedor, 
        costo, fechacita, sindicato, clavestatus, elpacienteesempleado, parentesco, departamento, fechaconsulta, claveusuario
      ) VALUES (
        @clavenomina, @clavepaciente, @nombrepaciente, @edad, @claveespecialidad, @claveproveedor, 
        @costo, @fechacita, @sindicato, @clavestatus, @elpacienteesempleado, @parentesco, @departamento, DATEADD(MINUTE, -4, GETDATE()), @claveusuario
      )
    `;  
    console.log("📋 Valores enviados al query de inserción:", {
      clavenomina,
      clavepaciente,
      nombrepaciente,
      edad,
      claveespecialidad,
      claveproveedor,
      costo,
      fechacita,
      sindicato,
      clavestatus,
      elpacienteesempleado,
      parentesco,
      departamento,
      claveusuario,
    });

    const insertResult = await pool
      .request()
      .input("clavenomina", sql.NVarChar, clavenomina)
      .input("clavepaciente", sql.NVarChar, clavepaciente)
      .input("nombrepaciente", sql.NVarChar, nombrepaciente)
      .input("edad", sql.NVarChar, edad)
      .input("claveespecialidad", sql.Int, claveespecialidad)
      .input("claveproveedor", sql.Int, claveproveedor)
      .input("costo", sql.Decimal, costo)
      .input("fechacita", sql.DateTime, fechacita ? new Date(fechacita) : null)
      .input("sindicato", sql.NVarChar, sindicato)
      .input("clavestatus", sql.Int, clavestatus)
      .input("elpacienteesempleado", sql.NVarChar, elpacienteesempleado)
      .input("parentesco", sql.NVarChar, parentesco)
      .input("departamento", sql.NVarChar, departamento)
      .input("claveusuario", sql.Int, claveusuario)
      .query(insertQuery);

    if (insertResult.rowsAffected[0] > 0) {
      console.log("✅ Pase insertado correctamente en la tabla consultas");
    } else {
      console.error("⚠️ No se insertó el pase en la tabla consultas");
      return res.status(500).json({ error: "Error al insertar el pase." });
    }

    // **Actualización en detalleEspecialidad**
    console.log("📄 Actualizando estatus en detalleEspecialidad...");
    const updateQuery = `
      UPDATE detalleEspecialidad
      SET estatus = 2
      WHERE claveconsulta = @folio
    `;
    console.log("📋 Valores enviados al query de actualización:", { folio });

    const updateResult = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(updateQuery);

    if (updateResult.rowsAffected[0] > 0) {
      console.log(
        `✅ Estatus actualizado correctamente en detalleEspecialidad (filas afectadas: ${updateResult.rowsAffected[0]})`
      );
    } else {
      console.log("⚠️ No se encontró ninguna fila con estatus = 1 para actualizar en detalleEspecialidad");
    }

    res.status(200).json({
      message: "Pase creado y estatus actualizado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al insertar pase o actualizar estatus:", error.message);
    console.error("⚠️ Detalles del error:", error);
    res.status(500).json({
      error: "Error al insertar el pase o actualizar el estatus",
      details: error.message,
    });
  }
}
