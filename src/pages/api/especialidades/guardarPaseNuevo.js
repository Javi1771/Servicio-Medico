import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  console.log("📥 [guardarConsulta] Inicio del handler");

  if (req.method === "POST") {
    const consultaData = req.body;

    //* Parsear claveproveedor como número
    const claveProveedorNum = Number(consultaData.claveproveedor);
    console.log("📥 [guardarConsulta] Datos recibidos:", consultaData);
    console.log("🔢 [guardarConsulta] claveProveedorNum =", claveProveedorNum);

    //* NUEVO: normalizar / validar clavepaciente (puede ser numérica o alfanumérica)
    const rawClavePaciente = consultaData.clavepaciente;
    const clavePacienteStr =
      rawClavePaciente === null ||
      rawClavePaciente === undefined ||
      rawClavePaciente === ""
        ? null
        : String(rawClavePaciente).trim();

    if (clavePacienteStr && clavePacienteStr.length > 15) {
      //* 15 es el máximo declarado en la BD / parámetro NVARCHAR(15)
      return res.status(400).json({
        success: false,
        message: "clavepaciente excede los 15 caracteres permitidos.",
      });
    }

    const esNumerica = /^\d+$/.test(clavePacienteStr || "");
    const clavePacienteParamType = esNumerica ? sql.Int : sql.NVarChar(15);
    const clavePacienteParamValue = esNumerica
      ? Number(clavePacienteStr)
      : clavePacienteStr;

    try {
      //? 1️⃣ Validar fecha de consulta
      if (
        !consultaData.fechaconsulta ||
        isNaN(new Date(consultaData.fechaconsulta))
      ) {
        console.log("⚠️ [guardarConsulta] Fecha inválida:", consultaData.fechaconsulta);
        return res
          .status(400)
          .json({ success: false, message: "La fecha de consulta no es válida." });
      }

      //? 2️⃣ Validar que la hora esté incluida
      const date = new Date(consultaData.fechaconsulta);
      const hasTime =
        date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

      if (!hasTime) {
        console.log(
          "⚠️ [guardarConsulta] Hora faltante en fecha:",
          consultaData.fechaconsulta,
        );
        return res.status(400).json({
          success: false,
          message:
            "La hora debe estar incluida en la fecha de consulta (formato completo ISO 8601).",
        });
      }

      //? 3️⃣ Conexión a la base de datos
      const pool = await connectToDatabase();
      console.log("🔌 [guardarConsulta] Conexión a BD establecida");

      //? 4️⃣ Insertar en consultas
      console.log("➡️ [guardarConsulta] Insertando en tabla consultas...");
      const result = await pool
        .request()
        .input("fechaconsulta", sql.DateTime, consultaData.fechaconsulta)
        .input("claveproveedor", sql.Int, claveProveedorNum || null)
        .input("clavenomina", sql.NVarChar(15), consultaData.clavenomina || null)
        //* usa tipo y valor dinámicos
        .input("clavepaciente", clavePacienteParamType, clavePacienteParamValue)
        .input("nombrepaciente", sql.NVarChar(50), consultaData.nombrepaciente || null)
        .input("edad", sql.NVarChar(50), consultaData.edad || null)
        .input("clavestatus", sql.Int, consultaData.clavestatus || null)
        .input(
          "elpacienteesempleado",
          sql.NVarChar(1),
          consultaData.elpacienteesempleado || null,
        )
        .input("parentesco", sql.Int, consultaData.parentesco ?? null)
        .input("claveusuario", sql.Int, consultaData.claveusuario || null)
        .input("departamento", sql.NChar(200), consultaData.departamento || null)
        .input(
          "especialidadinterconsulta",
          sql.Int,
          consultaData.especialidadinterconsulta || null,
        )
        .input("costo", sql.Money, consultaData.costo || 0)
        .input(
          "fechacita",
          sql.DateTime,
          consultaData.fechacita ? new Date(consultaData.fechacita) : null,
        )
        .input("sindicato", sql.NVarChar(10), consultaData.sindicato || null)
        .input("seasignoaespecialidad", sql.NVarChar(1), "S")
        .query(`
          INSERT INTO consultas (
            fechaconsulta,
            claveproveedor,
            clavenomina,
            clavepaciente,
            nombrepaciente,
            edad,
            clavestatus,
            elpacienteesempleado,
            parentesco,
            claveusuario,
            departamento,
            especialidadinterconsulta,
            costo,
            fechacita,
            sindicato,
            seasignoaespecialidad
          ) VALUES (
            SWITCHOFFSET(CONVERT(DATETIMEOFFSET, @fechaconsulta), DATENAME(TzOffset, SYSDATETIMEOFFSET())),
            @claveproveedor,
            @clavenomina,
            @clavepaciente,
            @nombrepaciente,
            @edad,
            @clavestatus,
            @elpacienteesempleado,
            @parentesco,
            @claveusuario,
            @departamento,
            @especialidadinterconsulta,
            @costo,
            @fechacita,
            @sindicato,
            @seasignoaespecialidad
          );
          SELECT SCOPE_IDENTITY() AS claveConsulta;
        `);

      const claveConsulta = result.recordset[0].claveConsulta;
      console.log(
        `✅ [guardarConsulta] Insert en consultas exitoso. claveConsulta=${claveConsulta}`,
      );

      //? 5️⃣ Insertar en costos solo si claveProveedorNum === 610
      if (claveProveedorNum === 610) {
        console.log("➡️ [guardarConsulta] claveProveedorNum es 610; insertando en costos");
        await pool
          .request()
          .input("claveproveedor", sql.Int, claveProveedorNum)
          .input("clavenomina", sql.NVarChar(15), consultaData.clavenomina || null)
          //* reutiliza tipo / valor ya calculados
          .input("clavepaciente", clavePacienteParamType, clavePacienteParamValue)
          .input(
            "elpacienteesempleado",
            sql.NVarChar(1),
            consultaData.elpacienteesempleado || null,
          )
          .input("departamento", sql.NChar(200), consultaData.departamento || null)
          .input(
            "especialidadinterconsulta",
            sql.Int,
            consultaData.especialidadinterconsulta || null,
          )
          .input("claveConsulta", sql.Int, claveConsulta)
          .query(`
            INSERT INTO costos (
              claveproveedor,
              clavenomina,
              clavepaciente,
              elpacienteesempleado,
              estatus,
              departamento,
              especialidadinterconsulta,
              claveconsulta
            ) VALUES (
              @claveproveedor,
              @clavenomina,
              @clavepaciente,
              @elpacienteesempleado,
              1,
              @departamento,
              @especialidadinterconsulta,
              @claveConsulta
            );
          `);
        console.log("✅ [guardarConsulta] Insert en costos exitoso");
      } else {
        console.log(
          `⛔ [guardarConsulta] claveProveedorNum ${claveProveedorNum} no es 610; no inserta en costos`,
        );
      }

      //? 6️⃣ Registrar actividad usuario
      const rawCookies = req.headers.cookie || "";
      const claveusuarioCookie = rawCookies
        .split("; ")
        .find((c) => c.startsWith("claveusuario="))
        ?.split("=")[1];
      const claveusuarioInt = claveusuarioCookie ? Number(claveusuarioCookie) : null;

      if (claveusuarioInt !== null) {
        console.log(
          `➡️ [guardarConsulta] Insertando en ActividadUsuarios para user ${claveusuarioInt}`,
        );
        const ip =
          req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
          req.connection?.remoteAddress;
        const userAgent = req.headers["user-agent"] || "";

        await pool
          .request()
          .input("userId", sql.Int, claveusuarioInt)
          .input("accion", sql.VarChar, "Creó un nuevo pase de especialidad")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, claveConsulta)
          .query(`
            INSERT INTO dbo.ActividadUsuarios (
              IdUsuario,
              Accion,
              FechaHora,
              DireccionIP,
              AgenteUsuario,
              ClaveConsulta
            ) VALUES (
              @userId,
              @accion,
              DATEADD(MINUTE, -4, GETDATE()),
              @direccionIP,
              @agenteUsuario,
              @claveConsulta
            );
          `);
        console.log("✅ [guardarConsulta] Registro en ActividadUsuarios exitoso");
      } else {
        console.log("⚠️ [guardarConsulta] No se registró actividad: falta claveusuario");
      }

      //? 7️⃣ Respuesta exitosa
      console.log("🎉 [guardarConsulta] Handler finalizado con éxito");
      return res
        .status(200)
        .json({ success: true, message: "Consulta guardada correctamente.", claveConsulta });
    } catch (error) {
      console.error("❌ [guardarConsulta] Error al guardar la consulta:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error al guardar la consulta." });
    }
  }

  console.log(`⚠️ [guardarConsulta] Método no permitido: ${req.method}`);
  return res.status(405).json({ success: false, message: "Método no permitido." });
}
