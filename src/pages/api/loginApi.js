/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "./connectToDatabase";

// Función para parsear cookies del header (si se requiere para otras operaciones)
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

    // Consulta: Diferencia mayúsculas y minúsculas
    const result = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query(
        `SELECT clavetipousuario, password, nombreproveedor, claveespecialidad, claveproveedor, costo, activo 
         FROM proveedores 
         WHERE usuario COLLATE Latin1_General_CS_AS = @usuario AND activo = 'S'`
      );

    console.log("Resultado de la consulta:", result.recordset);

    // Valida si el usuario existe
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado o inactivo (mayúsculas y minúsculas)",
      });
    }

    const user = result.recordset[0];

    // Verifica si la contraseña está encriptada (bcrypt)
    const isPasswordEncrypted =
      user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

    if (isPasswordEncrypted) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Fallo en autenticación: contraseña incorrecta");
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
        .query(
          `UPDATE proveedores SET password = @hashedPassword WHERE usuario COLLATE Latin1_General_CS_AS = @usuario`
        );
      console.log("Contraseña encriptada y actualizada");
    }

    console.log("Usuario autenticado:", {
      claveproveedor: user.claveproveedor,
      nombreproveedor: user.nombreproveedor,
      clavetipousuario: user.clavetipousuario,
      activo: user.activo,
    });

    // Genera el token JWT de acceso (expira en 1 hora)
    const token = jwt.sign(
      { rol: user.clavetipousuario, nombreproveedor: user.nombreproveedor },
      "clave_secreta",
      { expiresIn: "1h" }
    );

    // Genera el refresh token (expira en 30 días)
    const refreshToken = jwt.sign(
      { rol: user.clavetipousuario, nombreproveedor: user.nombreproveedor },
      "clave_secreta_refresh",
      { expiresIn: "30d" }
    );

    // Bandera Secure solo en producción
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    // Configuración de tiempos de expiración
    const tokenMaxAge = 60 * 60; // 1 hora en segundos
    const refreshTokenMaxAge = 30 * 24 * 60 * 60; // 30 días en segundos

    // Establece las cookies:
    res.setHeader("set-cookie", [
      `token=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${tokenMaxAge}`,
      `rol=${user.clavetipousuario}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
      `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
      `nombreusuario=${encodeURIComponent(user.nombreproveedor)}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
      `claveespecialidad=${user.claveespecialidad}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
      `claveusuario=${user.claveproveedor}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
      `costo=${user.costo}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${refreshTokenMaxAge}`,
    ]);

    // Registrar la actividad (opcional)
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
      console.log("Actividad de inicio registrada.");
    } catch (errorRegistro) {
      console.error("Error registrando actividad:", errorRegistro);
      // Continúa aun si falla el registro
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
