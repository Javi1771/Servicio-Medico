import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      clavenomina,
      fechaInicial,
      fechaFinal,
      diagnostico,
      clavepaciente,
    } = req.body;

    //* Obtener la cookie 'claveusuario' del header
    const cookies = req.headers.cookie || "";
    const claveusuarioMatch = cookies.match(/claveusuario=([^;]+)/);
    const claveusuario = claveusuarioMatch ? Number(claveusuarioMatch[1]) : null;

    // *Validar datos obligatorios
    if (!clavenomina || !clavepaciente) {
      const datosFaltantes = [];
      if (!clavenomina) datosFaltantes.push("clavenomina");
      if (!clavepaciente) datosFaltantes.push("clavepaciente");
      console.error("Faltan datos obligatorios:", datosFaltantes);
      return res
        .status(400)
        .json({ message: "Faltan datos obligatorios.", datosFaltantes });
    }

    //* Convertir las fechas a formato ISO (para que SQL Server las entienda)
    const fechaInicialISO = fechaInicial ? fechaInicial.replace(" ", "T") : null;
    const fechaFinalISO = fechaFinal ? fechaFinal.replace(" ", "T") : null;

    //* Si no se envía un diagnóstico, se usa el mensaje predeterminado
    const diagnosticoFinal =
      diagnostico ||
      "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta";

    //* Se asigna incapacidad si el diagnóstico es distinto del mensaje predeterminado
    const seAsignoIncapacidad =
      diagnosticoFinal === "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta"
        ? 0
        : 1;
    //* Definir el estatus: por ejemplo, 2 si no se asignó, 1 si se asignó
    const estatus =
      diagnosticoFinal === "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta"
        ? 2
        : 1;

    let transaction;
    try {
      const pool = await connectToDatabase();
      transaction = new sql.Transaction(pool);
      await transaction.begin();
      console.log("Transacción iniciada.");

      //? 1. Inserción en detalleIncapacidad
      await transaction
        .request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("fechaInicial", sql.VarChar, fechaInicialISO)
        .input("fechaFinal", sql.VarChar, fechaFinalISO)
        .input("diagnostico", sql.Text, diagnosticoFinal)
        .input("estatus", sql.Int, estatus)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .input("claveMedico", sql.Int, claveusuario)
        .query(`
          INSERT INTO detalleIncapacidad 
            (claveConsulta, noNomina, fechaInicial, fechaFinal, diagnostico, estatus, clavepaciente, claveMedico)
          VALUES 
            (@claveConsulta, @clavenomina, CONVERT(datetime2(7), @fechaInicial, 126), CONVERT(datetime2(7), @fechaFinal, 126), @diagnostico, @estatus, @clavepaciente, @claveMedico)
        `);
      console.log(`Incapacidad guardada exitosamente en la base de datos con estatus: ${estatus}`);

      //? 2. Actualización en la tabla consultas
      await transaction
        .request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("seAsignoIncapacidad", sql.Int, seAsignoIncapacidad)
        .query(`
          UPDATE consultas
          SET seAsignoIncapacidad = @seAsignoIncapacidad
          WHERE claveConsulta = @claveConsulta
        `);
      console.log(`Columna seAsignoIncapacidad actualizada con valor: ${seAsignoIncapacidad}`);

      //? 3. Registro de actividad (solo si se asignó incapacidad)
      if (seAsignoIncapacidad === 1) {
        try {
          if (claveusuario !== null) {
            let ip =
              (req.headers["x-forwarded-for"] &&
                req.headers["x-forwarded-for"].split(",")[0].trim()) ||
              req.connection?.remoteAddress ||
              req.socket?.remoteAddress ||
              (req.connection?.socket
                ? req.connection.socket.remoteAddress
                : null);
            const userAgent = req.headers["user-agent"] || "";
            await pool
              .request()
              .input("userId", sql.Int, claveusuario)
              .input("accion", sql.VarChar, "Asignó una incapacidad")
              .input("direccionIP", sql.VarChar, ip)
              .input("agenteUsuario", sql.VarChar, userAgent)
              .input("claveConsulta", sql.Int, parseInt(claveConsulta, 10))
              .query(`
                INSERT INTO dbo.ActividadUsuarios 
                  (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
                VALUES 
                  (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
              `);
            console.log("Actividad de asignación de incapacidad registrada.");
          } else {
            console.log("Cookie 'claveusuario' no encontrada; actividad no registrada.");
          }
        } catch (errorRegistro) {
          console.error("Error registrando actividad de asignación:", errorRegistro);
        }
      }

      //* Confirmar la transacción
      await transaction.commit();
      console.log("Transacción confirmada.");

      //* (Opcional) Consulta para obtener el historial actualizado
      const result = await pool
        .request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .query(`
          SELECT 
            d.claveConsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion,
            d.clavepaciente
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE 
            d.clavenomina = @clavenomina
            AND d.fecha_asignacion >= DATEADD(MONTH, -1, GETDATE()) 
          ORDER BY d.fecha_asignacion DESC
        `);
      const historial = result.recordset;
      console.log("Historial actualizado (último mes):", historial);

      res.status(200).json({
        message: "Incapacidad guardada correctamente.",
        historial,
      });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);
      try {
        await transaction.rollback();
        console.log("Transacción revertida debido a un error.");
      } catch (rollbackError) {
        console.error("❌ Error al hacer rollback:", rollbackError);
      }
      res.status(500).json({ message: "Error al guardar la incapacidad." });
    }
  } else {
    console.warn("❌ Método no permitido.");
    res.status(405).json({ message: "Método no permitido" });
  }
}
