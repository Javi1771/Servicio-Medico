/* eslint-disable camelcase */
import { connectToDatabase } from "../connectToDatabase";
import sql        from "mssql";
import cookie     from "cookie";
import formidable from "formidable";
import fs         from "fs";
import path       from "path";

//! ───── Next: desactivar bodyParser ───── */
export const config = { api: { bodyParser: false } };

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  //* Obtener los valores en UTC para preservar la hora exacta de la base de datos
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

export default async function handler(req, res) {
  const db      = await connectToDatabase();
  const request = db.request();

  //* ─────────── GET ─────────── */
  if (req.method === "GET") {
    try {
      const { recordset } = await request.query(`
        SELECT IdAviso, ClaveProveedor, Aviso, Motivo, Url_Imagen, Fecha, Urgencia
        FROM   AvisosDesarrolladores
        ORDER  BY Fecha DESC
      `);
      //* Preparamos raw y formatted para depuración
      const formatted = recordset.map((row) => ({
        ...row,
        Fecha: formatFecha(row.Fecha),
      }));

      //* Log para revisar en consola del servidor
      // console.log("[Avisos GET] Raw recordset:", recordset);
      // console.log("[Avisos GET] Formatted:", formatted);

      //* Enviamos ambos al front para inspección
      return res.status(200).json({ raw: recordset, formatted });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener avisos" });
    }
  }

  //* ─────────── POST ─────────── */
  if (req.method === "POST") {
    //? 1️⃣  Seguridad por rol */
    const cookies = cookie.parse(req.headers.cookie || "");
    if (cookies.rol !== "7")
      return res.status(403).json({ error: "Sin permiso para publicar" });

    //? 2️⃣  Parsear multipart */
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: "Archivo inválido" });
      }

      //? 3️⃣  Normalizar texto */
      const rawAviso    = Array.isArray(fields.aviso)    ? fields.aviso[0]    : fields.aviso;
      const rawMotivo   = Array.isArray(fields.motivo)   ? fields.motivo[0]   : fields.motivo;
      const rawUrgencia = Array.isArray(fields.urgencia) ? fields.urgencia[0] : fields.urgencia;

      const aviso    = (rawAviso    || "").trim();
      const motivo   = (rawMotivo   || "").trim();
      const urgencia = (rawUrgencia || "NORMAL").toUpperCase() === "URGENTE" ? "URGENTE" : "NORMAL";

      if (!aviso) return res.status(400).json({ error: "El aviso es obligatorio" });

      const claveProveedor = parseInt(cookies.claveusuario || "0", 10) || null;

      //? 4️⃣  Procesar imagen (opcional) */
      let urlImagen = null;
      const img = files.imagen
        ? Array.isArray(files.imagen) ? files.imagen[0] : files.imagen
        : null;

      if (img?.filepath) {
        const publicDir = path.join(process.cwd(), "public", "avisos");
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

        const ext      = path.extname(img.originalFilename || ".jpg");
        const fileName = `${Date.now()}${ext}`;
        const destPath = path.join(publicDir, fileName);

        try {
          fs.copyFileSync(img.filepath, destPath);
          fs.unlinkSync(img.filepath);
        } catch (moveErr) {
          console.error(moveErr);
          return res.status(500).json({ error: "No se pudo guardar la imagen" });
        }
        urlImagen = `/avisos/${fileName}`;
      }

      //? 5️⃣  Insertar aviso y devolver IdAviso */
      let idAviso;
      try {
        const { recordset } = await request
          .input("claveProveedor", sql.Int, claveProveedor)
          .input("aviso",    sql.NVarChar(sql.MAX), aviso)
          .input("motivo",   sql.NVarChar(sql.MAX), motivo || null)
          .input("url",      sql.NVarChar(sql.MAX), urlImagen)
          .input("urgencia", sql.VarChar(10), urgencia)
          .query(`
            INSERT INTO AvisosDesarrolladores
                   (ClaveProveedor, Aviso, Fecha, Url_Imagen, Motivo, Urgencia)
            OUTPUT inserted.IdAviso
            VALUES (@claveProveedor, @aviso, GETDATE(), @url, @motivo, @urgencia)
          `);
        idAviso = recordset[0].IdAviso;
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: "Error al guardar aviso" });
      }

      //? 6️⃣  Registrar actividad del usuario */
      try {
        //* 👉 Datos de IP y navegador  */
        const ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket
            ? req.connection.socket.remoteAddress
            : null);

        const userAgent = req.headers["user-agent"] || "";

        await db.request()
          .input("userId",        sql.Int, claveProveedor)
          .input("accion",        sql.VarChar, "Subió un aviso")
          .input("direccionIP",   sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("idAviso",       sql.Int, idAviso)
          .query(`
            INSERT INTO dbo.ActividadUsuarios
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdAviso)
            VALUES
              (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idAviso)
          `);
      } catch (actErr) {
        //! No abortamos si falla la bitácora, solo avisamos por consola */
        console.error("⛔ No se pudo registrar actividad:", actErr);
      }

      //? 7️⃣  Respuesta final */
      return res.status(201).json({ message: "Aviso guardado", IdAviso: idAviso });
    });
    return;
  }

  //! ─────────── Método NO permitido ─────────── */
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
