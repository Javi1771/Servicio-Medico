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

    //* ─────  cookie con claveusuario  ───── */
    const cookies = req.headers.cookie || "";
    const claveusuarioMatch = cookies.match(/claveusuario=([^;]+)/);
    const claveusuario = claveusuarioMatch ? Number(claveusuarioMatch[1]) : null;

    //* ─────  validación mínima  ───── */
    if (!clavenomina || !clavepaciente) {
      const faltantes = [];
      if (!clavenomina) faltantes.push("clavenomina");
      if (!clavepaciente) faltantes.push("clavepaciente");
      return res
        .status(400)
        .json({ message: "Faltan datos obligatorios.", faltantes });
    }

    //* ─────  ⬇️ CAMBIO 1: NO tocamos las fechas ⬇️  ───── */
    const fechaInicialSQL = fechaInicial; // viene “YYYY-MM-DD HH:mm:ss.fff”
    const fechaFinalSQL   = fechaFinal;   // viene “YYYY-MM-DD HH:mm:ss.fff”

    //* ─────  derivar flags  ───── */
    const diagnosticoFinal =
      diagnostico ||
      "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta";

    const seAsignoIncapacidad =
      diagnosticoFinal ===
      "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta"
        ? 0
        : 1;

    const estatus = seAsignoIncapacidad === 1 ? 1 : 2;

    //* ─────  transacción  ───── */
    let transaction;
    try {
      const pool = await connectToDatabase();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      //? 1. INSERT detalleIncapacidad */
      await transaction
        .request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("fechaInicial", sql.VarChar, fechaInicialSQL) // ← sin tocar
        .input("fechaFinal", sql.VarChar, fechaFinalSQL)     // ← sin tocar
        .input("diagnostico", sql.Text, diagnosticoFinal)
        .input("estatus", sql.Int, estatus)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .input("claveMedico", sql.Int, claveusuario)
        .query(`
          INSERT INTO detalleIncapacidad
            (claveConsulta, noNomina, fechaInicial, fechaFinal,
             diagnostico, estatus, clavepaciente, claveMedico)
          VALUES
            (@claveConsulta, @clavenomina,
             CONVERT(datetime2(7), @fechaInicial, 120),
             CONVERT(datetime2(7), @fechaFinal,   120),
             @diagnostico, @estatus, @clavepaciente, @claveMedico)
        `);

      //? 2. UPDATE consultas */
      await transaction
        .request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("seAsignoIncapacidad", sql.Int, seAsignoIncapacidad)
        .query(`
          UPDATE consultas
          SET seAsignoIncapacidad = @seAsignoIncapacidad
          WHERE claveConsulta = @claveConsulta
        `);

      //? 3. actividad (sin cambios) */
      if (seAsignoIncapacidad === 1 && claveusuario !== null) {
        const ip =
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
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()),
               @direccionIP, @agenteUsuario, @claveConsulta)
          `);
      }

      await transaction.commit();

      //? 4. Historial (sin cambios) */
      const { recordset: historial } = await pool
        .request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .query(`
          SELECT
            d.claveConsulta,
            ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
            d.prioridad,
            d.observaciones,
            FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss')
              AS fecha_asignacion,
            d.clavepaciente
          FROM detalleEspecialidad d
          LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
          WHERE d.clavenomina = @clavenomina
            AND d.fecha_asignacion >= DATEADD(MONTH, -1, GETDATE())
          ORDER BY d.fecha_asignacion DESC
        `);

      return res.status(200).json({
        message: "Incapacidad guardada correctamente.",
        historial,
      });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);
      try {
        if (transaction) await transaction.rollback();
      } catch (rbErr) {
        console.error("❌ Error al hacer rollback:", rbErr);
      }
      return res.status(500).json({ message: "Error al guardar la incapacidad." });
    }
  }

  res.status(405).json({ message: "Método no permitido" });
}
