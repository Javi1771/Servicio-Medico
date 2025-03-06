import https from "https";
import { parse } from "url";
import next from "next";
import fs from "fs";
import { Server } from "socket.io";
import sql from "mssql";
import { connectToDatabase } from "./src/utils/connectToDatabase.js";

// Permitir certificados autofirmados (útil en entornos de desarrollo o certificados propios)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Cargar certificados SSL
const httpsOptions = {
  key: fs.readFileSync("./172.16.4.47-key.pem"),
  cert: fs.readFileSync("./172.16.4.47.pem"),
};

app.prepare().then(() => {
  // Crear servidor HTTPS para Next.js
  const server = https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Inicializar Socket.IO en el mismo servidor
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Un usuario se ha conectado");

    // Envía un mensaje de bienvenida al cliente
    socket.emit("welcome", {
      message: "Bienvenido al dashboard en tiempo real",
    });

    // Escucha el evento "user-activity" que envían los clientes
    socket.on("user-activity", async (data) => {
      console.log("Actividad recibida:", data);
      try {
        // Conecta a la base de datos y guarda la actividad
        const pool = await connectToDatabase();
        await pool
          .request()
          .input("userId", sql.Int, data.userId)
          .input("accion", sql.VarChar, data.action)
          .input("direccionIP", sql.VarChar, data.ip || null)
          .input("agenteUsuario", sql.VarChar, data.userAgent || null)
          .query(`
            INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario)
            VALUES (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario)
          `);
        console.log("Actividad guardada en la base de datos.");

        // Emite la actividad a todos los clientes conectados
        io.emit("user-activity", data);
      } catch (err) {
        console.error("Error guardando actividad:", err);
      }
    });

    // Maneja la desconexión del cliente
    socket.on("disconnect", () => {
      console.log("Un usuario se ha desconectado");
    });
  });

  // Arranca el servidor HTTPS en la IP y puerto especificados
  server.listen(3000, "172.16.4.47", (err) => {
    if (err) throw err;
    console.log("Servidor HTTPS corriendo en https://172.16.4.47:3000");
  });
});
