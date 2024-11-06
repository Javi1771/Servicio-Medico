// pages/api/createEspecialidad.js

import { connectToDatabase } from '../api/connectToDatabase'; // Asegúrate de que la ruta sea correcta
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { claveespecialidad, especialidad, especial, estatus } = req.body;

    try {
      const pool = await connectToDatabase(); // Conectar a la base de datos

      // Realizar la inserción en la tabla de especialidades
      await pool.request()
        .input('claveespecialidad', sql.Int, claveespecialidad)
        .input('especialidad', sql.VarChar, especialidad)
        .input('especial', sql.VarChar, especial)
        .input('estatus', sql.Bit, estatus)
        .query(`
          INSERT INTO especialidades 
            (claveespecialidad, especialidad, especial, estatus)
          VALUES 
            (@claveespecialidad, @especialidad, @especial, @estatus)
        `);

      res.status(201).json({ message: 'Especialidad creada exitosamente' });
    } catch (error) {
      console.error('Error al crear la especialidad:', error);
      res.status(500).json({ message: 'Error al crear la especialidad', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
