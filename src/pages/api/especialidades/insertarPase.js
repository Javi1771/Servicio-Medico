import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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
    return res.status(400).json({ error: "Falta 'claveusuario' en las cookies." });
  }

  if (!clavenomina || !clavepaciente || !claveespecialidad || !folio) {
    return res.status(400).json({ error: "Datos incompletos." });
  }

  try {
    const pool = await connectToDatabase();

    //? 1️⃣ Insertar en consultas
    const insertQuery = `
      INSERT INTO consultas (
        clavenomina, clavepaciente, nombrepaciente, edad,
        especialidadinterconsulta, claveproveedor, costo,
        fechacita, sindicato, clavestatus,
        elpacienteesempleado, parentesco, departamento,
        fechaconsulta, claveusuario
      )
      OUTPUT INSERTED.claveconsulta
      VALUES (
        @clavenomina, @clavepaciente, @nombrepaciente, @edad,
        @claveespecialidad, @claveproveedor, @costo,
        @fechacita, @sindicato, @clavestatus,
        @elpacienteesempleado, @parentesco, @departamento,
        DATEADD(MINUTE, -4, GETDATE()), @claveusuario
      )`;

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
      return res.status(500).json({ error: "Error al insertar el pase en consultas." });
    }

    const claveconsulta = insertResult.recordset[0].claveconsulta;

    //? 2️⃣ Insertar en costos solo si claveproveedor = 610
    if (Number(claveproveedor) === 610) {
      const costoQuery = `
        INSERT INTO costos (
          claveproveedor, clavenomina, clavepaciente,
          elpacienteesempleado, estatus, departamento,
          especialidadinterconsulta, claveconsulta
        ) VALUES (
          @claveproveedor, @clavenomina, @clavepaciente,
          @elpacienteesempleado, 1, @departamento,
          @claveespecialidad, @claveconsulta
        )`;

      await pool
        .request()
        .input("claveproveedor", sql.Int, claveproveedor)
        .input("clavenomina", sql.NVarChar, clavenomina)
        .input("clavepaciente", sql.NVarChar, clavepaciente)
        .input("elpacienteesempleado", sql.NVarChar, elpacienteesempleado)
        .input("departamento", sql.NVarChar, departamento)
        .input("claveespecialidad", sql.Int, claveespecialidad)
        .input("claveconsulta", sql.Int, claveconsulta)
        .query(costoQuery);
    }

    //? 3️⃣ Actualizar detalleEspecialidad
    const updateQuery = `
      UPDATE detalleEspecialidad
      SET estatus = 2
      WHERE claveconsulta = @folio`;

    await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(updateQuery);

    //? 4️⃣ Registrar actividad
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuarioInt = claveusuarioCookie ? Number(claveusuarioCookie) : null;

    if (claveusuarioInt) {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.connection?.remoteAddress;
      const userAgent = req.headers["user-agent"] || "";

      const actQuery = `
        INSERT INTO dbo.ActividadUsuarios 
          (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
        VALUES 
          (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveconsulta)`;

      await pool
        .request()
        .input("userId", sql.Int, claveusuarioInt)
        .input("accion", sql.VarChar, "Capturó un pase de especialidad")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("claveconsulta", sql.Int, claveconsulta)
        .query(actQuery);
    }

    return res.status(200).json({ message: "Pase creado y estatus actualizado correctamente", claveconsulta });
  } catch (error) {
    console.error("Error al insertar pase o actualizar estatus:", error);
    return res.status(500).json({ error: error.message });
  }
}
