/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "./connectToDatabase";

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split("; ").reduce((acc, cookieStr) => {
    const [key, value] = cookieStr.split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query(`
        SELECT clavetipousuario, password, nombreproveedor, claveespecialidad, claveproveedor, costo, activo 
        FROM proveedores 
        WHERE usuario COLLATE Latin1_General_CS_AS = @usuario AND activo = 'S'
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado o inactivo (mayúsculas y minúsculas)",
      });
    }

    const user = result.recordset[0];
    const isPasswordEncrypted =
      user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

    if (isPasswordEncrypted) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Contraseña incorrecta",
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool
        .request()
        .input("hashedPassword", sql.VarChar, hashedPassword)
        .input("usuario", sql.VarChar, usuario)
        .query(`
          UPDATE proveedores 
          SET password = @hashedPassword 
          WHERE usuario COLLATE Latin1_General_CS_AS = @usuario
        `);
    }

    const token = jwt.sign(
      { rol: user.clavetipousuario, nombreproveedor: user.nombreproveedor },
      "clave_secreta",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { rol: user.clavetipousuario, nombreproveedor: user.nombreproveedor },
      "clave_secreta_refresh",
      { expiresIn: "30d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "; Secure" : "";
    const tokenMaxAge = 60 * 60; //* 1 hora
    const refreshTokenMaxAge = 30 * 24 * 60 * 60; //* 30 días

    res.setHeader("set-cookie", [
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${tokenMaxAge}${secureFlag}`,
      `rol=${user.clavetipousuario}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
      `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
      `nombreusuario=${encodeURIComponent(user.nombreproveedor)}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
      `claveespecialidad=${user.claveespecialidad}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
      `claveusuario=${user.claveproveedor}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
      `costo=${user.costo}; Path=/; SameSite=Lax; Max-Age=${refreshTokenMaxAge}${secureFlag}`,
    ]);

    try {
      const cookies = parseCookies(req.headers.cookie);
      const idUsuario = user.claveproveedor;
      let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const userAgent = req.headers["user-agent"] || "";
      await pool
        .request()
        .input("userId", sql.Int, idUsuario)
        .input("accion", sql.VarChar, "Inicio de sesión")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .query(`
          INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario)
          VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario)
        `);
    } catch (errorRegistro) {
      console.error("Error registrando actividad:", errorRegistro);
    }

    return res.status(200).json({
      success: true,
      message: "Login exitoso",
      rol: user.clavetipousuario,
      nombreproveedor: user.nombreproveedor,
      claveespecialidad: user.claveespecialidad,
      claveproveedor: user.claveproveedor,
      costo: user.costo,
    });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}
