// pages/api/usuario.js

import { connectToDatabase } from './connectToDatabase'; // Asegúrate de que la ruta sea correcta
import sql from 'mssql';
import bcrypt from 'bcrypt'; // Importar bcrypt

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
      clavetipousuario 
    } = req.body;

    try {
      const pool = await connectToDatabase(); // Conectar a la base de datos

      // Encriptar la contraseña antes de almacenarla
      const hashedPassword = await bcrypt.hash(password, 10);

      // Realizar la inserción con el campo activo por defecto como 'S'
      await pool.request()
        .input('nombreusuario', sql.VarChar, nombreusuario)
        .input('direcciousuario', sql.VarChar, direcciousuario)
        .input('coloniausuario', sql.VarChar, coloniausuario)
        .input('telefonousuario', sql.VarChar, telefonousuario)
        .input('celularusuario', sql.VarChar, celularusuario)
        .input('cedulausuario', sql.VarChar, cedulausuario)
        .input('claveespecialidad', sql.Int, claveespecialidad) // Asegúrate de que esté en formato entero
        .input('usuario', sql.VarChar, usuario)
        .input('password', sql.VarChar, hashedPassword) // Guardar la contraseña encriptada
        .input('clavetipousuario', sql.Int, clavetipousuario) // Asegúrate de que esté en formato entero
        .input('activo', sql.VarChar, 'S') // Establecer el campo activo como 'S'
        .query(`
          INSERT INTO USUARIOS 
            (nombreusuario, direcciousuario, coloniausuario, telefonousuario, celularusuario, cedulausuario, claveespecialidad, usuario, password, clavetipousuario, activo)
          VALUES 
            (@nombreusuario, @direcciousuario, @coloniausuario, @telefonousuario, @celularusuario, @cedulausuario, @claveespecialidad, @usuario, @password, @clavetipousuario, @activo)
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
