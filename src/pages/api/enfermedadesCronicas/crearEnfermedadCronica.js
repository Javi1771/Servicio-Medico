// /pages/api/crearEnfermedadCronica.js

import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { cronica } = req.body;

    // Validar que el campo 'cronica' no esté vacío
    if (!cronica || typeof cronica !== 'string') {
      console.error('Error: El campo "cronica" es requerido y debe ser un string.');
      return res.status(400).json({ message: 'El campo "cronica" es requerido.' });
    }

    try {
      console.log("Intentando conectar a la base de datos...");
      const pool = await connectToDatabase();
      console.log("Conexión a la base de datos establecida.");

      console.log("Ejecutando inserción de la nueva enfermedad crónica...");
      await pool.request()
        .input('cronica', sql.VarChar, cronica)
        .input('estatus', sql.Bit, 1) // Estatus por defecto como activo
        .query(`
          INSERT INTO CRONICAS (cronica, estatus)
          VALUES (@cronica, @estatus)
        `);

      console.log("Enfermedad crónica agregada exitosamente.");
      res.status(201).json({ message: 'Enfermedad crónica agregada exitosamente' });
    } catch (error) {
      console.error('Error en el proceso de agregar enfermedad crónica:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });

      // Respuesta en caso de error
      if (error.message.includes('duplicate key')) {
        res.status(409).json({ message: 'La enfermedad crónica ya existe.' });
      } else {
        res.status(500).json({ message: 'Error al agregar la enfermedad crónica.', error: error.message });
      }
    }
  } else {
    console.warn(`Método ${req.method} no permitido en esta ruta.`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
