import sql from 'mssql';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '../api/connectToDatabase';

// Endpoint para editar un usuario
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const {
    claveespecialidad,
    clavetipousuario,
    nombreusuario,
    direcciousuario,
    coloniausuario,
    telefonousuario,
    celularusuario,
    cedulausuario,
    usuario,
    password,
  } = req.body;

  // Validación de datos
  if (!claveespecialidad || !clavetipousuario || !usuario) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const pool = await connectToDatabase();

    // Encriptar la contraseña antes de actualizarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar el usuario con la contraseña encriptada
    await pool.request()
      .input('nombreusuario', sql.VarChar, nombreusuario)
      .input('direcciousuario', sql.VarChar, direcciousuario)
      .input('coloniausuario', sql.VarChar, coloniausuario)
      .input('telefonousuario', sql.VarChar, telefonousuario)
      .input('celularusuario', sql.VarChar, celularusuario)
      .input('cedulausuario', sql.VarChar, cedulausuario)
      .input('claveespecialidad', sql.Int, claveespecialidad)
      .input('usuario', sql.VarChar, usuario)
      .input('password', sql.VarChar, hashedPassword) // Usa la contraseña encriptada
      .input('clavetipousuario', sql.Int, clavetipousuario)
      .query(`
        UPDATE usuarios
        SET 
          nombreusuario = @nombreusuario,
          direcciousuario = @direcciousuario,
          coloniausuario = @coloniausuario,
          telefonousuario = @telefonousuario,
          celularusuario = @celularusuario,
          cedulausuario = @cedulausuario,
          claveespecialidad = @claveespecialidad,
          password = @password,
          clavetipousuario = @clavetipousuario
        WHERE usuario = @usuario
      `);

    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
