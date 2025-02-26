/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // 🔥 Permitir certificados autofirmados

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Cargar certificados SSL
const httpsOptions = {
  key: fs.readFileSync("./172.16.4.47-key.pem"),
  cert: fs.readFileSync("./172.16.4.47.pem"),
};

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
 //}).listen(3005, "172.16.4.47", (err) => {
 }).listen(3000, "172.16.12.100", (err) => {
    if (err) throw err;
    //console.log("🚀 Servidor HTTPS corriendo en https://172.16.4.47:3005");
    console.log("🚀 Servidor HTTPS corriendo en https://172.16.12.100:3000");
  });
});