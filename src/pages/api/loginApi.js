/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { usuario, password } = req.body;

  try {
    const pool = await connectToDatabase();

    //* Consulta para obtener sólo usuarios activos
    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .query(
        `SELECT clavetipousuario, password, nombreproveedor, claveespecialidad, claveproveedor, costo, activo 
         FROM proveedores 
         WHERE usuario = @usuario AND activo = 'S'`
      );

    console.log("Resultado de la consulta de usuarios activos:", result.recordset);

    //! Valida si el usuario existe
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
      });
    }

    const user = result.recordset[0];

    //? Verifica si la contraseña está encriptada (asume que los hashes bcrypt empiezan con $2b$ o $2a$)
    const isPasswordEncrypted = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

    if (isPasswordEncrypted) {
      //* Comparar contraseña encriptada
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Fallo en la autenticación: contraseña incorrecta");
        return res.status(401).json({
          success: false,
          message: 'Contraseña incorrecta',
        });
      }
    } else {
      //* Primera vez: Encripta la contraseña y actualiza en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.request()
        .input('hashedPassword', sql.VarChar, hashedPassword)
        .input('usuario', sql.VarChar, usuario)
        .query(
          `UPDATE proveedores SET password = @hashedPassword WHERE usuario = @usuario`
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
      'clave_secreta',
      { expiresIn: '1h' }
    );

    //* Establece las cookies
    res.setHeader('set-cookie', [
      `token=${token}; path=/; samesite=lax`,
      `rol=${user.clavetipousuario}; path=/; samesite=lax`,
      `nombreusuario=${encodeURIComponent(user.nombreproveedor)}; path=/; samesite=lax`,
      `claveespecialidad=${user.claveespecialidad}; path=/; samesite=lax`,
      `claveusuario=${user.claveproveedor}; path=/; samesite=lax`,
      `costo=${user.costo}; path=/; samesite=lax`,
    ]);

    //* Devuelve la respuesta con éxito
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      rol: user.clavetipousuario,
      nombreproveedor: user.nombreproveedor,
      claveespecialidad: user.claveespecialidad,
      claveproveedor: user.claveproveedor,
      costo: user.costo,
    });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
}
