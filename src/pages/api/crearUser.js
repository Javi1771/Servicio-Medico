import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { 
      nombreusuario,
      direcciousuario,
      coloniausuario,
      telefonousuario,
      celularusuario,
      cedulausuario,
      claveespecialidad,
      usuario,
      password,
      clavetipousuario,
      costoconsulta // Asegúrate de que este campo venga del front-end
    } = req.body;

    try {
      const pool = await connectToDatabase();

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserción de datos con el parámetro corregido
      await pool.request()
        .input('nombreusuario', sql.VarChar, nombreusuario)
        .input('direcciousuario', sql.VarChar, direcciousuario)
        .input('coloniausuario', sql.VarChar, coloniausuario)
        .input('telefonousuario', sql.VarChar, telefonousuario)
        .input('celularusuario', sql.VarChar, celularusuario)
        .input('cedulausuario', sql.VarChar, cedulausuario)
        .input('claveespecialidad', sql.Int, claveespecialidad)
        .input('usuario', sql.VarChar, usuario)
        .input('password', sql.VarChar, hashedPassword)
        .input('clavetipousuario', sql.Int, clavetipousuario)
        .input('costo', sql.Money, costoconsulta || 0.0) // Corregido aquí
        .input('activo', sql.VarChar, 'S')
        .query(`
          INSERT INTO USUARIOS 
          (nombreusuario, direcciousuario, coloniausuario, telefonousuario, celularusuario, cedulausuario, claveespecialidad, usuario, password, clavetipousuario, costo, activo)
          VALUES 
          (@nombreusuario, @direcciousuario, @coloniausuario, @telefonousuario, @celularusuario, @cedulausuario, @claveespecialidad, @usuario, @password, @clavetipousuario, @costo, @activo)
        `);

      res.status(201).json({ message: 'Usuario agregado exitosamente' });
    } catch (error) {
      console.error('Error al agregar el usuario:', error);
      res.status(500).json({ message: 'Error al agregar el usuario', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
