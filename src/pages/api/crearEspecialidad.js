import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { especialidad } = req.body;

    if (!especialidad || typeof especialidad !== 'string') {
      return res.status(400).json({ message: 'El campo "especialidad" es requerido.' });
    }

    try {
      const pool = await connectToDatabase();

      await pool.request()
        .input('especialidad', sql.VarChar, especialidad)
        .input('estatus', sql.Bit, 1) // Estatus por defecto como activo
        .query(`
          INSERT INTO especialidades 
            (especialidad, estatus)
          VALUES 
            (@especialidad, @estatus)
        `);

      res.status(201).json({ message: 'Especialidad agregada exitosamente' });
    } catch (error) {
      if (error.message.includes("duplicate key row")) {
        // Responder con un mensaje claro sobre el índice único
        return res.status(409).json({ 
          message: 'Ya existe una especialidad con este nombre.' 
        });
      }
      res.status(500).json({ 
        message: 'Error al agregar la especialidad', 
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
