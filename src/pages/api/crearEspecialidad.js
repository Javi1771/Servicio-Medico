// pages/api/crearEspecialidad.js

import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { especialidad } = req.body;

    // Validar que el campo 'especialidad' no esté vacío
    if (!especialidad || typeof especialidad !== 'string') {
      console.error('Error: El campo "especialidad" es requerido y debe ser un string.');
      return res.status(400).json({ message: 'El campo "especialidad" es requerido.' });
    }

    try {
      console.log("Intentando conectar a la base de datos...");
      const pool = await connectToDatabase();
      console.log("Conexión a la base de datos establecida.");

      console.log("Ejecutando inserción de la nueva especialidad...");
      await pool.request()
        .input('especialidad', sql.VarChar, especialidad)
        .input('estatus', sql.Bit, 1) // Estatus por defecto como activo
        .query(`
          INSERT INTO especialidades 
            (especialidad, estatus)
          VALUES 
            (@especialidad, @estatus)
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
