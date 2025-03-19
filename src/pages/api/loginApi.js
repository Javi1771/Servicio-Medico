/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "./connectToDatabase";

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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  try {
    const pool = await connectToDatabase();

    //* Consulta con COLLATE para diferenciar mayúsculas y minúsculas
    const result = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query(
        `SELECT clavetipousuario, password, nombreproveedor, claveespecialidad, claveproveedor, costo, activo 
         FROM proveedores 
         WHERE usuario COLLATE Latin1_General_CS_AS = @usuario AND activo = 'S'`
      );

    console.log(
      "Resultado de la consulta de usuarios activos:",
      result.recordset
    );

    //! Valida si el usuario existe
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Usuario no encontrado o inactivo (diferenciando mayúsculas y minúsculas)",
      });
    }

    const user = result.recordset[0];

    //? Verifica si la contraseña está encriptada (hashes bcrypt empiezan con $2b$ o $2a$)
    const isPasswordEncrypted =
      user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

    if (isPasswordEncrypted) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Fallo en la autenticación: contraseña incorrecta");
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
      console.log("Contraseña encriptada y actualizada en la base de datos.");
    }

    console.log("Usuario autenticado:", {
      claveproveedor: user.claveproveedor,
      nombreproveedor: user.nombreproveedor,
      clavetipousuario: user.clavetipousuario,
      activo: user.activo,
    });

    //* Genera el token
    const token = jwt.sign(
      { rol: user.clavetipousuario, nombreproveedor: user.nombreproveedor },
      "clave_secreta",
      { expiresIn: "1h" }
    );

    //* Establece las cookies, incluyendo "claveusuario"
    res.setHeader("set-cookie", [
      `token=${token}; path=/; samesite=lax`,
      `rol=${user.clavetipousuario}; path=/; samesite=lax`,
      `nombreusuario=${encodeURIComponent(
        user.nombreproveedor
      )}; path=/; samesite=lax`,
      `claveespecialidad=${user.claveespecialidad}; path=/; samesite=lax`,
      `claveusuario=${user.claveproveedor}; path=/; samesite=lax`,
      `costo=${user.costo}; path=/; samesite=lax`,
    ]);

    //* Registrar la actividad de inicio de sesión usando la cookie "claveusuario"
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
        .input("agenteUsuario", sql.VarChar, userAgent).query(`
          INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario)
          VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario)
        `);
      console.log("Actividad de inicio de sesión registrada.");
    } catch (errorRegistro) {
      console.error("Error registrando actividad:", errorRegistro);
      //! Puedes decidir continuar aun si la inserción falla
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
