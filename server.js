/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const socketIo = require("socket.io");
const sql = require("mssql");
const { connectToDatabase } = require("../connectToDatabase"); 

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //* Permitir certificados autofirmados

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

//* Cargar certificados SSL
const httpsOptions = {
  key: fs.readFileSync("./172.16.4.47-key.pem"),
  cert: fs.readFileSync("./172.16.4.47.pem"),
};

app.prepare().then(() => {
  //* Creamos el servidor HTTPS con Next.js
  const server = https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  //* Integrar Socket.io en el mismo servidor
  const io = socketIo(server, {
    cors: {
      origin: "*", 
    },
  });

  //* Escuchar conexiones
  io.on("connection", (socket) => {
    console.log("Un usuario se ha conectado");

    //* Enviar un mensaje de bienvenida al cliente
    socket.emit("welcome", { message: "Bienvenido al dashboard en tiempo real" });

    //* Recibir actividad de usuario y guardarla en la base de datos
    socket.on("user-activity", async (data) => {
      console.log("Actividad recibida:", data);
      try {
        //* Conecta a la base de datos
        const pool = await connectToDatabase();
        //* Inserta la actividad usando una consulta parametrizada
        await pool.request()
          .input("userId", sql.Int, data.userId)
          .input("accion", sql.VarChar, data.action)
          .input("direccionIP", sql.VarChar, data.ip || null)
          .input("agenteUsuario", sql.VarChar, data.userAgent || null)
          .query(`
            INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario)
            VALUES (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario)
          `);
        console.log("Actividad guardada en la base de datos.");
      } catch (err) {
        console.error("Error guardando actividad:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Un usuario se ha desconectado");
    });
  });

  //* Iniciar el servidor en la IP y puerto especificados
  //server.listen(3000, "172.16.4.47", (err) => {
  server.listen(3000, "172.16.12.100", (err) => {
    if (err) throw err;
    //console.log("Servidor HTTPS corriendo en https://172.16.4.47:3000");
    console.log("Servidor HTTPS corriendo en https://172.16.12.100:3000");
  });
});
