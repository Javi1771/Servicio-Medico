// pages/api/usuario.js

import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta
import sql from 'mssql';

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

      // Realizar la inserción
      await pool.request()
        .input('nombreusuario', sql.VarChar, nombreusuario)
        .input('direcciousuario', sql.VarChar, direcciousuario)
        .input('coloniausuario', sql.VarChar, coloniausuario)
        .input('telefonousuario', sql.VarChar, telefonousuario)
        .input('celularusuario', sql.VarChar, celularusuario)
        .input('cedulausuario', sql.VarChar, cedulausuario)
        .input('claveespecialidad', sql.Int, claveespecialidad) // Asegurarse de que esté en formato entero
        .input('usuario', sql.VarChar, usuario)
        .input('password', sql.VarChar, password)                   
        .input('clavetipousuario', sql.Int, clavetipousuario) // Asegurarse de que esté en formato entero
        .query(`
          INSERT INTO USUARIOS 
            (nombreusuario, direcciousuario, coloniausuario, telefonousuario, celularusuario, cedulausuario, claveespecialidad, usuario, password, clavetipousuario)
          VALUES 
            (@nombreusuario, @direcciousuario, @coloniausuario, @telefonousuario, @celularusuario, @cedulausuario, @claveespecialidad, @usuario, @password, @clavetipousuario)
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
