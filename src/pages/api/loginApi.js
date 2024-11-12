import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { usuario, password } = req.body;

  try {
    const pool = await connectToDatabase();
    
    // Actualiza la consulta con los nombres de columnas correctos
    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .query('SELECT clavetipousuario, password FROM USUARIOS WHERE usuario = @usuario');

    const user = result.recordset[0];
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const storedPassword = user.password;
    let isMatch = false;

    if (storedPassword === password) {
      isMatch = true;
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.request()
        .input('usuario', sql.VarChar, usuario)
        .input('hashedPassword', sql.VarChar, hashedPassword)
        .query('UPDATE USUARIOS SET password = @hashedPassword WHERE usuario = @usuario');
    } else {
      isMatch = await bcrypt.compare(password, storedPassword);
    }

    if (isMatch) {
      // Usar clavetipousuario en el token
      const token = jwt.sign({ rol: user.clavetipousuario }, 'clave_secreta', { expiresIn: '1h' });

      res.setHeader('Set-Cookie', [
        `token=${token}; Path=/; SameSite=Lax`,
        `rol=${user.clavetipousuario}; Path=/; SameSite=Lax`
      ]);

      return res.status(200).json({ success: true, message: 'Login exitoso', rol: user.clavetipousuario });
    } else {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
}
