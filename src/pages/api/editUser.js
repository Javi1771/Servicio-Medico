import sql from 'mssql';
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
    password, // La nueva contraseña que puede ser proporcionada
  } = req.body;

  // Validación de datos
  if (!claveespecialidad || !clavetipousuario || !usuario) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const pool = await connectToDatabase();

    // Preparar la consulta de actualización
    const request = pool.request()
      .input('nombreusuario', sql.VarChar, nombreusuario)
      .input('direcciousuario', sql.VarChar, direcciousuario)
      .input('coloniausuario', sql.VarChar, coloniausuario)
      .input('telefonousuario', sql.VarChar, telefonousuario)
      .input('celularusuario', sql.VarChar, celularusuario)
      .input('cedulausuario', sql.VarChar, cedulausuario)
      .input('claveespecialidad', sql.Int, claveespecialidad)
      .input('clavetipousuario', sql.Int, clavetipousuario)
      .input('usuario', sql.VarChar, usuario);

    let query; // Variable para almacenar la consulta

    // Si se proporciona una nueva contraseña, actualízala directamente
    if (password && password.trim() !== '') {
      request.input('password', sql.VarChar, password); // Usar la nueva contraseña directamente

      query = `UPDATE usuarios
               SET 
                 nombreusuario = @nombreusuario,
                 direcciousuario = @direcciousuario,
                 coloniausuario = @coloniausuario,
                 telefonousuario = @telefonousuario,
                 celularusuario = @celularusuario,
                 cedulausuario = @cedulausuario,
                 claveespecialidad = @claveespecialidad,
                 clavetipousuario = @clavetipousuario,
                 password = @password
               WHERE usuario = @usuario`;
    } else {
      // Si no se proporciona una nueva contraseña, solo actualizar otros campos
      query = `UPDATE usuarios
               SET 
                 nombreusuario = @nombreusuario,
                 direcciousuario = @direcciousuario,
                 coloniausuario = @coloniausuario,
                 telefonousuario = @telefonousuario,
                 celularusuario = @celularusuario,
                 cedulausuario = @cedulausuario,
                 claveespecialidad = @claveespecialidad,
                 clavetipousuario = @clavetipousuario
               WHERE usuario = @usuario`;
    }

    // Ejecutar la consulta
    await request.query(query);

    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
