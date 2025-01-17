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

    //* consulta para obtener sólo usuarios activos
    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .query(
        `SELECT clavetipousuario, password, nombreusuario, claveespecialidad, claveusuario, costo, activo 
         FROM USUARIOS 
         WHERE usuario = @usuario AND activo = \'S\'`
      );

    // log de resultados de la consulta
    console.log("resultado de la consulta de usuarios activos:", result.recordset);

    // valida si hay usuarios activos con el nombre de usuario
    const user = result.recordset.find(async (u) => {
      const isMatch = await bcrypt.compare(password, u.password);
      return isMatch; // retorna el usuario cuyo password coincida
    });

    // log del usuario encontrado
    if (user) {
      console.log("usuario autenticado:", {
        claveusuario: user.claveusuario,
        nombreusuario: user.nombreusuario,
        clavetipousuario: user.clavetipousuario,
        activo: user.activo,
      });
    } else {
      console.log("fallo en la autenticación: usuario no encontrado o contraseña incorrecta");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'usuario no encontrado, inactivo o contraseña incorrecta',
      });
    }

    //* genera el token
    const token = jwt.sign(
      { rol: user.clavetipousuario, nombreusuario: user.nombreusuario },
      'clave_secreta',
      { expiresIn: '1h' }
    );

    //* establece las cookies
    res.setHeader('set-cookie', [
      `token=${token}; path=/; samesite=lax`,
      `rol=${user.clavetipousuario}; path=/; samesite=lax`,
      `nombreusuario=${encodeURIComponent(user.nombreusuario)}; path=/; samesite=lax`,
      `claveespecialidad=${user.claveespecialidad}; path=/; samesite=lax`,
      `claveusuario=${user.claveusuario}; path=/; samesite=lax`,
      `costo=${user.costo}; path=/; samesite=lax`,
    ]);

    //* devuelve la respuesta con éxito
    return res.status(200).json({
      success: true,
      message: 'login exitoso',
      rol: user.clavetipousuario,
      nombreusuario: user.nombreusuario,
      claveespecialidad: user.claveespecialidad,
      claveusuario: user.claveusuario,
      costo: user.costo,
    });
  } catch (error) {
    console.error("error en el servidor:", error);
    res.status(500).json({ success: false, message: 'error en el servidor' });
  }
}
