/* eslint-disable camelcase */
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import cookie from "cookie";
import formidable from "formidable";
import fs from "fs";
import path from "path";

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
  const db = await connectToDatabase();
  const request = db.request();
  const cookies = cookie.parse(req.headers.cookie || "");
  const userId = parseInt(cookies.claveusuario || "0", 10) || null;

  //* Util para IP y UA
  const getClientInfo = () => {
    const ip =
      (req.headers["x-forwarded-for"] &&
        req.headers["x-forwarded-for"].split(",")[0].trim()) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection?.socket ? req.connection.socket.remoteAddress : null);
    const ua = req.headers["user-agent"] || "";
    return { ip, ua };
  };

  //* ─────────── GET ─────────── */
  if (req.method === "GET") {
    try {
      const { recordset } = await request
        .input("user", sql.Int, userId)
        .query(`
          SELECT
            P.IdPropuesta,
            P.Completado AS Completado,    
            P.ClaveUsuario,
            P.Propuesta,
            P.Motivo,
            P.Url_Imagen,
            P.Fecha,
            P.Likes,
            CASE WHEN L.ClaveUsuario IS NULL THEN 0 ELSE 1 END AS YaLike
          FROM Propuestas AS P
          LEFT JOIN PropuestasLikes AS L
            ON L.IdPropuesta = P.IdPropuesta
          AND L.ClaveUsuario = @user
          WHERE
            P.Completado = 0
            OR (
                P.Completado = 1
                AND P.Fecha >= DATEADD(WEEK, -1, GETDATE())
            )
          ORDER BY P.Fecha DESC;
      `);

      //* Aplicar formateo de fecha
      const formatted = recordset.map(row => ({
        ...row,
        Fecha: formatFecha(row.Fecha),
      }));

      return res.status(200).json(formatted);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Error al obtener propuestas" });
    }
  }

  //* ─────────── PATCH ─────────── */
  if (req.method === "PATCH") {
    const idProp = Number(req.query.id);
    if (!idProp || !userId)
      return res.status(400).json({ error: "Parámetros inválidos" });

    //* si viene ?complete=1, marcamos completada
    if (req.query.complete) {
      try {
        await request.input("idProp", sql.Int, idProp).query(`
            UPDATE Propuestas
            SET Completado = 1
            WHERE IdPropuesta = @idProp
        `);
        return res.status(200).json({ Completado: 1 });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Error al completar propuesta" });
      }
    }

    //! de lo contrario, registramos el like
    try {
      const { rowsAffected } = await request
        .input("idProp", sql.Int, idProp)
        .input("user", sql.Int, userId)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM PropuestasLikes
            WHERE IdPropuesta = @idProp AND ClaveUsuario = @user
          )
          BEGIN
            INSERT INTO PropuestasLikes (IdPropuesta, ClaveUsuario)
            VALUES (@idProp, @user);

            UPDATE Propuestas
            SET Likes = Likes + 1
            WHERE IdPropuesta = @idProp;
          END
        `);

      if (rowsAffected[0] > 0) {
        const { ip, ua } = getClientInfo();
        await db
          .request()
          .input("userId", sql.Int, userId)
          .input("accion", sql.VarChar, "Dió like a una propuesta")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, ua)
          .input("idPropuesta", sql.Int, idProp)
          .query(`
            INSERT INTO ActividadUsuarios
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdPropuesta)
            VALUES
              (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idPropuesta)
          `);
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Error al registrar like" });
    }
  }

  //* ─────────── POST ─────────── */
  if (req.method === "POST") {
    if (!userId)
      return res.status(403).json({ error: "Inicia sesión para proponer" });

    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: "Archivo inválido" });
      }

      const texto = (
        Array.isArray(fields.texto) ? fields.texto[0] : fields.texto || ""
      ).trim();
      const motivo = (
        Array.isArray(fields.motivo) ? fields.motivo[0] : fields.motivo || ""
      ).trim();
      if (!texto)
        return res.status(400).json({ error: "La propuesta es obligatoria" });

      let urlImg = null;
      const img = files.imagen
        ? Array.isArray(files.imagen)
          ? files.imagen[0]
          : files.imagen
        : null;

      if (img?.filepath) {
        const dir = path.join(process.cwd(), "public", "propuestas");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const ext = path.extname(img.originalFilename || ".jpg");
        const fname = `${Date.now()}${ext}`;
        fs.copyFileSync(img.filepath, path.join(dir, fname));
        fs.unlinkSync(img.filepath);
        urlImg = `/propuestas/${fname}`;
      }

      try {
        const { recordset } = await request
          .input("user", sql.Int, userId)
          .input("prop", sql.NVarChar(sql.MAX), texto)
          .input("motivo", sql.NVarChar(sql.MAX), motivo || null)
          .input("url", sql.NVarChar(sql.MAX), urlImg)
          .query(`
            INSERT INTO Propuestas
                   (ClaveUsuario, Propuesta, Motivo, Url_Imagen, Fecha, Likes, Completado)
            OUTPUT inserted.IdPropuesta
            VALUES (@user, @prop, @motivo, @url, GETDATE(), 0, 0)
          `);

        const idNew = recordset[0].IdPropuesta;
        const { ip, ua } = getClientInfo();
        await db
          .request()
          .input("userId", sql.Int, userId)
          .input("accion", sql.VarChar, "Subió una propuesta")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, ua)
          .input("idPropuesta", sql.Int, idNew)
          .query(`
            INSERT INTO ActividadUsuarios
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdPropuesta)
            VALUES
              (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idPropuesta)
          `);

        return res
          .status(201)
          .json({ message: "Propuesta guardada", IdPropuesta: idNew });
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: "Error al guardar propuesta" });
      }
    });

    return;
  }

  //! ─────────── Método NO permitido ─────────── */
  res.setHeader("Allow", ["GET", "POST", "PATCH"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
