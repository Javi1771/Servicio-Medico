import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      claveEspecialidad,
      observaciones,
      clavenomina,
      prioridad,
      clavepaciente,
    } = req.body;

    // console.log("🟢 Datos recibidos en la solicitud:", {
    //   claveConsulta,
    //   claveEspecialidad,
    //   observaciones,
    //   clavenomina,
    //   prioridad,
    //   clavepaciente,
    // });

    //* Validación de datos obligatorios
    if (!claveConsulta || !clavenomina || !clavepaciente) {
      console.error("❌ Datos incompletos:", {
        claveConsulta,
        claveEspecialidad,
        observaciones,
        clavenomina,
        prioridad,
        clavepaciente,
      });
      return res.status(400).json({ message: "Datos incompletos." });
    }

    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);

    try {
      //* Inicia la transacción
      await transaction.begin();

      //* Se obtiene la fecha de registro en formato deseado
      const now = new Date();
      const fechaRegistro = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      //? Si claveEspecialidad es "N", se considera que no se asignó especialidad
      const claveEspecialidadFinal =
        claveEspecialidad === "N" ? null : claveEspecialidad;

      //? Se determina el valor de observaciones, usando un mensaje predeterminado en caso de que no se haya ingresado
      const observacionesFinal =
        observaciones ||
        "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta";

      //? Se determina el estatus:
      //? 1 = asignada, 0 = sin asignar, en función de si se asignó claveEspecialidad y observaciones distintas al mensaje predeterminado
      let estatus = 1;
      if (
        !claveEspecialidadFinal &&
        observacionesFinal.trim() ===
          "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta"
      ) {
        estatus = 0;
      }

      // console.log("🟠 Insertando en detalleEspecialidad con datos:", {
      //   claveconsulta: parseInt(claveConsulta, 10),
      //   clavenomina,
      //   claveespecialidad: claveEspecialidadFinal
      //     ? parseInt(claveEspecialidadFinal, 10)
      //     : null,
      //   observaciones: observacionesFinal,
      //   prioridad: prioridad || "N/A",
      //   estatus,
      //   fecha_asignacion: fechaRegistro,
      //   clavepaciente,
      // });

      //? Inserción en la tabla detalleEspecialidad
      await transaction
        .request()
        .input("claveconsulta", sql.Int, parseInt(claveConsulta, 10))
        .input("clavenomina", sql.VarChar, clavenomina)
        .input(
          "claveespecialidad",
          sql.Int,
          claveEspecialidadFinal ? parseInt(claveEspecialidadFinal, 10) : null
        )
        .input("observaciones", sql.NVarChar, observacionesFinal)
        .input("prioridad", sql.VarChar, prioridad || "N/A")
        .input("estatus", sql.Int, estatus)
        .input("fecha_asignacion", sql.DateTime, fechaRegistro)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .query(`
          INSERT INTO detalleEspecialidad 
            (claveconsulta, clavenomina, claveespecialidad, observaciones, prioridad, estatus, fecha_asignacion, clavepaciente)
          VALUES 
            (@claveconsulta, @clavenomina, @claveespecialidad, @observaciones, @prioridad, @estatus, @fecha_asignacion, @clavepaciente)
        `);

      //console.log("🟢 Registro insertado en la tabla detalleEspecialidad.");

      //? Actualización en la tabla consultas
      //console.log("🟠 Actualizando la tabla consultas...");
      await transaction
        .request()
        .input("claveconsulta", sql.Int, parseInt(claveConsulta, 10))
        .input(
          "claveespecialidad",
          sql.Int,
          claveEspecialidadFinal ? parseInt(claveEspecialidadFinal, 10) : null
        )
        .input(
          "seasignoaespecialidad",
          sql.VarChar,
          claveEspecialidadFinal ? "S" : "N"
        )
        .query(`
          UPDATE consultas
          SET 
            seasignoaespecialidad = @seasignoaespecialidad
          WHERE claveconsulta = @claveconsulta;
        `);

      //console.log("🟢 Tabla consultas actualizada.");

      //? Registrar la actividad de asignación de especialidad solo si se asignó (es decir, observacionesFinal es distinto al mensaje predeterminado)
      if (
        observacionesFinal.trim() !==
        "Sin Observaciones, No Se Asignó Especialidad En Esta Consulta"
      ) {
        try {
          const allCookies = cookie.parse(req.headers.cookie || "");
          const idUsuario =
            allCookies.claveusuario !== undefined
              ? Number(allCookies.claveusuario)
              : null;
          if (idUsuario !== null) {
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
              .input("userId", sql.Int, idUsuario)
              .input("accion", sql.VarChar, "Asignó especialidad")
              .input("direccionIP", sql.VarChar, ip)
              .input("agenteUsuario", sql.VarChar, userAgent)
              .input("claveConsulta", sql.Int, parseInt(claveConsulta, 10))
              .query(`
                INSERT INTO dbo.ActividadUsuarios 
                  (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
                VALUES 
                  (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
              `);
            //console.log("Actividad de asignación de especialidad registrada.");
          } else {
            // console.log(
            //   "Cookie 'claveusuario' no encontrada; actividad no registrada."
            // );
          }
        } catch (errorRegistro) {
          console.error(
            "Error registrando actividad de asignación:",
            errorRegistro
          );
        }
      }

      //* Confirmación de la transacción
      await transaction.commit();
      //console.log("🟢 Transacción confirmada.");

      //? (Opcional) Consulta para obtener el historial actualizado
      const result = await pool
        .request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .query(`
          SELECT 
            d.claveconsulta,
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
      //console.log("🟢 Historial actualizado (último mes):", historial);

      res.status(200).json({
        message: "Especialidad guardada correctamente.",
        historial,
      });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);
      try {
        await transaction.rollback();
        console.log("🔄 Transacción revertida debido a un error.");
      } catch (rollbackError) {
        console.error("❌ Error al hacer rollback:", rollbackError);
      }
      res.status(500).json({ message: "Error al guardar la especialidad." });
    }
  } else {
    console.warn("❌ Método no permitido.");
    res.status(405).json({ message: "Método no permitido" });
  }
}
