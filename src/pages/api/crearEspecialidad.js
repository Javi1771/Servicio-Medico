// pages/api/crearEspecialidad.js

import { connectToDatabase } from '../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { especialidad, especial, estatus } = req.body;

    if (!['N', 'S'].includes(especial)) {
      console.error('Error: El valor de "especial" no es válido. Recibido:', especial);
      return res.status(400).json({ message: 'El valor de "especial" debe ser "N" o "S".' });
    }

    try {
      console.log("Intentando conectar a la base de datos...");
      const pool = await connectToDatabase();
      console.log("Conexión a la base de datos establecida.");

      console.log("Ejecutando inserción de la nueva especialidad sin claveespecialidad...");
      await pool.request()
        .input('especialidad', sql.VarChar, especialidad)
        .input('especial', sql.VarChar, especial)
        .input('estatus', sql.Bit, estatus ? 1 : 0)
        .query(`
          INSERT INTO especialidades 
            (especialidad, especial, estatus)
          VALUES 
            (@especialidad, @especial, @estatus)
        `);

      console.log("Especialidad agregada exitosamente.");
      res.status(201).json({ message: 'Especialidad agregada exitosamente' });
    } catch (error) {
      console.error('Error en el proceso de agregar especialidad:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      res.status(500).json({ message: 'Error al agregar la especialidad', error: error.message });
    }
  } else {
    console.warn(`Método ${req.method} no permitido en esta ruta.`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
