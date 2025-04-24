/* eslint-disable camelcase */
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import cookie from "cookie";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const db = await connectToDatabase();
  const request = db.request();
  const cookies = cookie.parse(req.headers.cookie || "");
  const userId = parseInt(cookies.claveusuario || "0", 10) || null;

  //* util para IP y UA */
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
      const { recordset } = await request.input("user", sql.Int, userId).query(`
          SELECT  P.IdPropuesta, P.ClaveUsuario, P.Propuesta, P.Motivo,
                  P.Url_Imagen, P.Fecha, P.Likes,
                  CASE WHEN L.ClaveUsuario IS NULL THEN 0 ELSE 1 END AS YaLike
          FROM    Propuestas        AS P
          LEFT JOIN PropuestasLikes AS L
                 ON L.IdPropuesta  = P.IdPropuesta
                AND L.ClaveUsuario = @user
          ORDER BY P.Fecha DESC
        `);
      return res.status(200).json(recordset);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Error al obtener propuestas" });
    }
  }

  //? PATCH – registrar like con PK compuesta */
  if (req.method === "PATCH") {
    const idProp = Number(req.query.id);
    if (!idProp || !userId)
      return res.status(400).json({ error: "Parámetros inválidos" });

    try {
      const { rowsAffected } = await request
        .input("idProp", sql.Int, idProp)
        .input("user", sql.Int, userId).query(`
        IF NOT EXISTS (
          SELECT 1
          FROM   dbo.PropuestasLikes
          WHERE  IdPropuesta = @idProp AND ClaveUsuario = @user
        )
        BEGIN
          INSERT INTO dbo.PropuestasLikes (IdPropuesta, ClaveUsuario)
          VALUES (@idProp, @user);

          UPDATE dbo.Propuestas
          SET    Likes = Likes + 1
          WHERE  IdPropuesta = @idProp;
        END
      `);

      //? rowsAffected[0] > 0 ⇒ se creó el like */
      if (rowsAffected[0] > 0) {
        const { ip, ua } = getClientInfo();
        await db
          .request()
          .input("userId", sql.Int, userId)
          .input("accion", sql.VarChar, "Dió like a una propuesta")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, ua)
          .input("idPropuesta", sql.Int, idProp).query(`
          INSERT INTO dbo.ActividadUsuarios
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdLike)
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

  //* ─────────── POST ─────────── (nueva propuesta) */
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

      //* imagen opcional */
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
        //? Insertar propuesta y obtener IdPropuesta */
        const { recordset } = await request
          .input("user", sql.Int, userId)
          .input("prop", sql.NVarChar(sql.MAX), texto)
          .input("motivo", sql.NVarChar(sql.MAX), motivo || null)
          .input("url", sql.NVarChar(sql.MAX), urlImg).query(`
            INSERT INTO Propuestas
                   (ClaveUsuario, Propuesta, Motivo, Url_Imagen, Fecha, Likes)
            OUTPUT inserted.IdPropuesta
            VALUES (@user, @prop, @motivo, @url, GETDATE(), 0)
          `);

        const idProp = recordset[0].IdPropuesta;
        const { ip, ua } = getClientInfo();

        //? Registrar actividad */
        await db
          .request()
          .input("userId", sql.Int, userId)
          .input("accion", sql.VarChar, "Subió una propuesta")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, ua)
          .input("idPropuesta", sql.Int, idProp).query(`
            INSERT INTO dbo.ActividadUsuarios
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdPropuesta)
            VALUES
              (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idPropuesta)
          `);

        return res
          .status(201)
          .json({ message: "Propuesta guardada", IdPropuesta: idProp });
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: "Error al guardar propuesta" });
      }
    });

    return;
  }

  //! método no permitido */
  res.setHeader("Allow", ["GET", "POST", "PATCH"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
