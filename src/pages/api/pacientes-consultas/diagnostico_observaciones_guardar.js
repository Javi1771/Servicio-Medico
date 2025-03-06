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
    const { claveConsulta, diagnostico, motivoconsulta, claveusuario } = req.body;
    let transaction; //* Declarar la transacción fuera del try

    try {
      const pool = await connectToDatabase();
      transaction = new sql.Transaction(pool); //* Crear una transacción

      //* Obtener el valor de la cookie 'costo'
      const cookies = req.headers.cookie || "";
      const costoCookie = cookies
        .split("; ")
        .find((row) => row.startsWith("costo="))
        ?.split("=")[1];
      const costo = costoCookie ? parseFloat(costoCookie) : null;

      //* Validar campos obligatorios mínimos
      if (!claveConsulta || !diagnostico || !motivoconsulta || costo === null) {
        return res.status(400).json({ message: "Datos incompletos o inválidos." });
      }

      await transaction.begin(); //* Iniciar la transacción

      //* Construir la lista de columnas y valores dinámicos
      const sets = [
        "diagnostico = @diagnostico",
        "motivoconsulta = @motivoconsulta",
        "costo = @costo"
      ];
      const request = transaction.request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("diagnostico", sql.Text, diagnostico)
        .input("motivoconsulta", sql.Text, motivoconsulta)
        .input("costo", sql.Decimal(10, 2), costo);

      //* Agregar claveusuario y claveproveedor si se envía
      if (claveusuario !== undefined) {
        sets.push("claveusuario = @claveusuario", "claveproveedor = @claveusuario");
        request.input("claveusuario", sql.Int, claveusuario);
      }

      //* Generar el query de actualización
      const query = `
        UPDATE consultas
        SET ${sets.join(", ")}
        WHERE claveConsulta = @claveConsulta
      `;
      await request.query(query);
      await transaction.commit(); //* Confirmar la transacción

      console.log("✅ Consulta actualizada exitosamente. ClaveConsulta:", claveConsulta);

      //* Registrar la actividad: se extrae la cookie "claveusuario" y se usa para IdUsuario.
      try {
        const allCookies = parseCookies(req.headers.cookie);
        // Se usa la cookie "claveusuario" si existe; de lo contrario, se usa el valor enviado en el body.
        const idUsuario = allCookies.claveusuario
          ? Number(allCookies.claveusuario)
          : claveusuario !== undefined
          ? Number(claveusuario)
          : null;
        if (idUsuario === null) {
          console.log("❌ No se encontró valor para IdUsuario; actividad no registrada.");
        } else {
          const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          const userAgent = req.headers["user-agent"] || "";
          await pool.request()
            .input("userId", sql.Int, idUsuario)
            .input("accion", sql.VarChar, "Consulta atendida")
            .input("direccionIP", sql.VarChar, ip)
            .input("agenteUsuario", sql.VarChar, userAgent)
            .input("claveConsulta", sql.Int, claveConsulta)
            .query(`
              INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
              VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
            `);
          console.log("Actividad registrada en la base de datos.");
        }
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      //* Emitir un evento a través de Socket.io para notificar la actividad
      if (res.socket && res.socket.server && res.socket.server.io) {
        res.socket.server.io.emit("consulta-guardada", {
          claveConsulta,
          accion: "Consulta atendida",
          time: new Date().toISOString(),
        });
        console.log("Evento 'consulta-guardada' emitido.");
      } else {
        console.log("Socket.io no está disponible en res.socket.server.io");
      }

      res.status(200).json({
        message: "Consulta guardada correctamente.",
        claveConsulta,
      });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);
      if (transaction && transaction.isActive) {
        await transaction.rollback();
        console.log("❌ Transacción revertida debido a un error.");
      }
      res.status(500).json({ message: "Error al procesar la consulta." });
    }
  } else {
    console.log("❌ Método no permitido:", req.method);
    res.status(405).json({ message: "Método no permitido." });
  }
}
