/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
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
    const pool = await connectToDatabase(); // Aquí se asume que connectToDatabase no necesita parámetros
    console.log("Conectado a la base de datos para login");

    // Buscar al usuario en la base de datos
    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario) // Usar parámetros para evitar inyecciones SQL
      .query('SELECT password FROM USUARIOS WHERE usuario = @usuario');
    
    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar si la contraseña ingresada coincide con la almacenada en texto plano
    const isMatch = await bcrypt.compare(password, user.password);
    
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
