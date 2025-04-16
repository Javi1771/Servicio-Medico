import { connectToDatabase } from "../connectToDatabase";
import { parse } from "cookie";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    //console.log("Solicitud recibida:", req.body);

    const {
      fechaInicio,
      fechaFin,
      nomina,
      nombreEmpleado,
      departamento,
      observaciones,
      edad,
      claveConsulta,
      claveMedico,
    } = req.body;

    const db = await connectToDatabase();
    const request = db.request();

    //* Obtener quien capturó desde la cookie
    const cookies = parse(req.headers.cookie || "");
    const quienCapturo = cookies.claveusuario || null;

    //console.log("Cookies recibidas:", cookies);
    //console.log("Usuario que capturó:", quienCapturo);

    if (!quienCapturo) {
      console.error("Error: No se encontró la clave del usuario en la cookie");
      return res.status(400).json({
        error: "No se encontró la clave del usuario en la cookie",
      });
    }

    //* Validar fechas antes de insertar
    if (!fechaInicio || !fechaFin) {
      console.error("Error: Las fechas no pueden ser nulas");
      return res.status(400).json({ error: "Las fechas no pueden ser nulas" });
    }

    //* Obtener la fecha actual en formato compatible con SQL Server
    const now = new Date();
    const fechaActual = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;

    //console.log("Datos a insertar en la base de datos:", {
    //   fecha: fechaActual,
    //   fechaInicio,
    //   fechaFin,
    //   nomina,
    //   nombreEmpleado,
    //   departamento,
    //   observaciones,
    //   edad,
    //   claveConsulta,
    //   claveMedico,
    //   estatus: 1,
    //   cancelo: null,
    //   quienCapturo,
    // });

    //* Insertar en la tabla 'incapacidades' y obtener la clave generada
    const insertResult = await request
      .input("fecha", fechaActual)
      .input("fechainicio", fechaInicio)
      .input("fechafin", fechaFin)
      .input("nomina", nomina)
      .input("nombrepaciente", nombreEmpleado)
      .input("departamento", departamento)
      .input("observaciones", observaciones)
      .input("edad", edad)
      .input("claveconsulta", claveConsulta)
      .input("claveMedico", claveMedico)
      .input("estatus", 1)
      .input("cancelo", null)
      .input("quiencapturo", quienCapturo).query(`
        INSERT INTO incapacidades (
          fecha, fechainicio, fechafin, nomina, nombrepaciente, departamento, 
          observaciones, edad, claveconsulta, claveMedico, estatus, cancelo, quiencapturo
        )
        VALUES (
          @fecha, @fechainicio, @fechafin, @nomina, @nombrepaciente, @departamento,
          @observaciones, @edad, @claveconsulta, @claveMedico, @estatus, @cancelo, @quiencapturo
        );

        SELECT SCOPE_IDENTITY() AS claveIncapacidad;
      `);

    //* Recuperamos la clave generada
    const claveIncapacidad = insertResult.recordset[0].claveIncapacidad;
    //console.log("Se generó la clave de incapacidad:", claveIncapacidad);

    //* Actualizar el estatus en la tabla detalleIncapacidad
    const updateResult = await request
      .input("noNomina", sql.NVarChar, nomina)
      .input("folioConsulta", sql.Int, claveConsulta).query(`
        UPDATE detalleIncapacidad
        SET estatus = 2
        WHERE noNomina = @noNomina
          AND claveConsulta = @folioConsulta
      `);

    if (updateResult.rowsAffected[0] === 0) {
      console.error("No se actualizó ninguna fila en detalleIncapacidad.");
      return res
        .status(404)
        .json({ error: "No se encontraron registros para actualizar." });
    }

    //console.log("Actualización de estatus completada.");

    //* Insertar el registro de actividad en la tabla ActividadUsuarios,
    //* almacenando la claveIncapacidad en la columna IdCapIncapacidad
    //* (ajusta esta parte a tus columnas y valores reales)
    let ip =
    (req.headers["x-forwarded-for"] &&
      req.headers["x-forwarded-for"].split(",")[0].trim()) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null);
  
    const userAgent = req.headers["user-agent"] || "";

    await request
      .input("idUsuario", sql.Int, parseInt(quienCapturo, 10))
      .input("accion", sql.VarChar, "Capturó una incapacidad")
      .input("fechaHora", fechaActual)
      .input("direccionIP", sql.VarChar, ip)
      .input("agenteUsuario", sql.VarChar, userAgent)
      .input("idCapIncapacidad", sql.Int, claveIncapacidad).query(`
        INSERT INTO ActividadUsuarios
          (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdCapIncapacidad)
        VALUES
          (@idUsuario, @accion, @fechaHora, @direccionIP, @agenteUsuario, @idCapIncapacidad)
      `);

    //console.log("Registro de actividad insertado en ActividadUsuarios.");

    res.status(200).json({
      message: "Incapacidad guardada correctamente y estatus actualizado.",
      claveIncapacidad,
    });
  } catch (error) {
    console.error("Error al guardar incapacidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
