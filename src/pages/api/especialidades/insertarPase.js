// pages/api/consultas/insertarPase.js
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
    especialidadinterconsulta,
    claveproveedor,
    costo,
    fechacita,
    sindicato,
    clavestatus = 2,
  } = req.body;

  console.log("📥 Datos recibidos en el body:", {
    clavenomina,
    clavepaciente,
    nombrepaciente,
    edad,
    especialidadinterconsulta,
    claveproveedor,
    costo,
    fechacita,
    sindicato,
    clavestatus,
  });

  try {
    const pool = await connectToDatabase();
    console.log("✅ Conexión a la base de datos establecida");

    // 1. Insertar pase en la tabla "consultas"
    const insertQuery = `
      INSERT INTO consultas (
        clavenomina, clavepaciente, nombrepaciente, edad, 
        especialidadinterconsulta, claveproveedor, costo, fechacita, sindicato, clavestatus
      ) VALUES (
        @clavenomina, @clavepaciente, @nombrepaciente, @edad, 
        @especialidad, @claveproveedor, @costo, @fechacita, @sindicato, @clavestatus
      )
    `;

    console.log("📄 Ejecutando query de inserción en consultas...");
    const insertResult = await pool
      .request()
      .input("clavenomina", sql.Int, clavenomina)
      .input("clavepaciente", sql.Int, clavepaciente)
      .input("nombrepaciente", sql.NVarChar, nombrepaciente)
      .input("edad", sql.NVarChar, edad)
      .input("especialidad", sql.Int, especialidadinterconsulta) // Asegurarse de que sea un ID válido
      .input("claveproveedor", sql.Int, claveproveedor)
      .input("costo", sql.Decimal, costo)
      .input("fechacita", sql.DateTime, fechacita)
      .input("sindicato", sql.NVarChar, sindicato)
      .input("clavestatus", sql.Int, clavestatus)
      .query(insertQuery);

    console.log("✅ Pase insertado correctamente:", insertResult);

    // 2. Actualizar el estatus en la tabla "detalleEspecialidad"
    console.log("📄 Actualizando estatus en detalleEspecialidad...");
    const updateQuery = `
      UPDATE detalleEspecialidad
      SET estatus = 2
      WHERE claveconsulta = @claveconsulta AND estatus = 1
    `;

    const updateResult = await pool
      .request()
      .input("claveconsulta", sql.Int, clavenomina) // Usar claveconsulta o el folio correspondiente
      .query(updateQuery);

    if (updateResult.rowsAffected[0] > 0) {
      console.log(
        `✅ Estatus actualizado correctamente en detalleEspecialidad (filas afectadas: ${updateResult.rowsAffected[0]})`
      );
    } else {
      console.log("⚠️ No se encontró ninguna fila con estatus = 1 para actualizar");
    }

    res.status(200).json({ message: "Pase creado y estatus actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al insertar pase o actualizar estatus:", error.message);
    res.status(500).json({ error: "Error al insertar el pase o actualizar el estatus", details: error.message });
  }
}
