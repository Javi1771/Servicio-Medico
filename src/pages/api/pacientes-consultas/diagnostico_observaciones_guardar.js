import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para parsear cookies del header
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split("; ").reduce((acc, cookieStr) => {
    const [key, value] = cookieStr.split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      claveConsulta,
      diagnostico,
      motivoconsulta,
      alergias: rawAlergias,
      claveusuario,
    } = req.body;
    const alergias = rawAlergias || "";
    let transaction;

    try {
      const pool = await connectToDatabase();
      transaction = new sql.Transaction(pool);
      await transaction.begin(); //* Inicia la transacción

      //? Obtener el valor de la cookie 'costo'
      const cookies = req.headers.cookie || "";
      const costoCookie = cookies
        .split("; ")
        .find((row) => row.startsWith("costo="))
        ?.split("=")[1];
      const costo = costoCookie ? parseFloat(costoCookie) : null;

      //* Validar campos obligatorios mínimos
      if (
        !claveConsulta ||
        !diagnostico ||
        !motivoconsulta ||
        costo === null
      ) {
        throw new Error("Datos incompletos o inválidos.");
      }

      //? Construir la lista de columnas y valores dinámicos para el UPDATE
      const sets = [
        "diagnostico = @diagnostico",
        "motivoconsulta = @motivoconsulta",
        "costo = @costo",
        "alergias = @alergias",
      ];

      const request = transaction.request();
      request.input("claveConsulta", sql.Int, claveConsulta);
      request.input("diagnostico", sql.Text, diagnostico);
      request.input("motivoconsulta", sql.Text, motivoconsulta);
      request.input("costo", sql.Decimal(10, 2), costo);
      request.input("alergias", sql.VarChar(100), alergias);

      //? Agregar claveusuario y claveproveedor si se envía
      if (claveusuario !== undefined) {
        sets.push("claveusuario = @claveusuario", "claveproveedor = @claveusuario");
        request.input("claveusuario", sql.Int, claveusuario);
      }

      //? Ejecutar el UPDATE en la tabla "consultas"
      const query = `
        UPDATE consultas
        SET ${sets.join(", ")}
        WHERE claveConsulta = @claveConsulta
      `;
      await request.query(query);

      //? Registrar la actividad en la misma transacción
      const allCookies = parseCookies(req.headers.cookie);
      const idUsuario = allCookies.claveusuario
        ? Number(allCookies.claveusuario)
        : claveusuario !== undefined
        ? Number(claveusuario)
        : null;

      if (idUsuario !== null) {
        const ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket
            ? req.connection.socket.remoteAddress
            : null);

        const userAgent = req.headers["user-agent"] || "";
        const activityRequest = transaction.request();
        activityRequest.input("userId", sql.Int, idUsuario);
        activityRequest.input("accion", sql.VarChar, "Atendió una consulta");
        activityRequest.input("direccionIP", sql.VarChar, ip);
        activityRequest.input("agenteUsuario", sql.VarChar, userAgent);
        activityRequest.input("claveConsulta", sql.Int, claveConsulta);
        await activityRequest.query(`
          INSERT INTO dbo.ActividadUsuarios 
          (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
          VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
        `);
      }

      await transaction.commit(); //* Si todo sale bien, se confirma la transacción

      //* Emitir el evento de Socket.io (esta parte no afecta la transacción)
      if (res.socket?.server?.io) {
        res.socket.server.io.emit("consulta-guardada", {
          claveConsulta,
          accion: "Consulta atendida",
          time: new Date().toISOString(),
        });
      }

      res.status(200).json({
        message: "Consulta guardada correctamente.",
        claveConsulta,
      });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);
      if (transaction && !transaction._aborted) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error("Error durante el rollback:", rollbackError);
        }
      }
      res.status(500).json({ message: "Error al procesar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
