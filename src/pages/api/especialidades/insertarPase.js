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

  console.log("📥 Datos recibidos:", {
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
    console.log("✅ Conexión establecida");

    //* Inserción en la tabla "consultas" con OUTPUT para obtener la claveconsulta generada.
    const insertQuery = `
      INSERT INTO consultas (
        clavenomina, clavepaciente, nombrepaciente, edad, especialidadinterconsulta, claveproveedor, 
        costo, fechacita, sindicato, clavestatus, elpacienteesempleado, parentesco, departamento, fechaconsulta, claveusuario
      )
      OUTPUT INSERTED.claveconsulta
      VALUES (
        @clavenomina, @clavepaciente, @nombrepaciente, @edad, @claveespecialidad, @claveproveedor, 
        @costo, @fechacita, @sindicato, @clavestatus, @elpacienteesempleado, @parentesco, @departamento, DATEADD(MINUTE, -4, GETDATE()), @claveusuario
      )
    `;
    console.log("📋 Insert Query valores:", {
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

    if (insertResult.rowsAffected[0] <= 0) {
      console.error("⚠️ No se insertó el pase en consultas");
      return res.status(500).json({ error: "Error al insertar el pase." });
    }
    console.log("✅ Pase insertado en consultas");

    //* Obtener la claveconsulta generada
    const claveconsulta = insertResult.recordset[0].claveconsulta;
    console.log("Claveconsulta obtenida:", claveconsulta);

    //* Actualización en detalleEspecialidad (se mantiene el update usando folio)
    console.log("📄 Actualizando estatus en detalleEspecialidad...");
    const updateQuery = `
      UPDATE detalleEspecialidad
      SET estatus = 2
      WHERE claveconsulta = @folio
    `;
    console.log("📋 Valores enviados para update:", { folio });
    const updateResult = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(updateQuery);

    if (updateResult.rowsAffected[0] > 0) {
      console.log(
        `✅ Estatus actualizado en detalleEspecialidad (filas afectadas: ${updateResult.rowsAffected[0]})`
      );
    } else {
      console.log("⚠️ No se encontró ninguna fila para actualizar en detalleEspecialidad");
    }

    //* Registrar la actividad "Creó un pase de especialidad" usando la claveconsulta generada
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuarioInt = claveusuarioCookie ? Number(claveusuarioCookie) : null;
    console.log("Cookie claveusuario:", claveusuarioInt);

    if (claveusuarioInt !== null) {
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"] || "";
      await pool.request()
        .input("userId", sql.Int, claveusuarioInt)
        .input("accion", sql.VarChar, "Capturó un pase de especialidad")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("claveConsulta", sql.Int, claveconsulta)
        .query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
        `);
      console.log("Actividad 'Creó un pase de especialidad' registrada en ActividadUsuarios.");
    } else {
      console.log("No se pudo registrar la actividad: falta claveusuario.");
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
