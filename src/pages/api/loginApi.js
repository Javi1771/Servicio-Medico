import sql from 'mssql';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { usuario, password } = req.body;

  try {
    // Conectar a la base de datos
    const pool = await connectToDatabase();

    // Buscar al usuario en la base de datos
    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .query('SELECT password FROM USUARIOS WHERE usuario = @usuario');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const storedPassword = user.password;
    let isMatch = false;

    // Comparar directamente (para contraseñas no encriptadas)
    if (storedPassword === password) {
      isMatch = true;
      
      // Encriptar la contraseña y actualizar en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.request()
        .input('usuario', sql.VarChar, usuario)
        .input('hashedPassword', sql.VarChar, hashedPassword)
        .query('UPDATE USUARIOS SET password = @hashedPassword WHERE usuario = @usuario');
    } else {
      // Intentar comparar con bcrypt (para contraseñas encriptadas)
      isMatch = await bcrypt.compare(password, storedPassword);
    }

    if (isMatch) {
      return res.status(200).json({ success: true, message: 'Login exitoso' });
    } else {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
}
