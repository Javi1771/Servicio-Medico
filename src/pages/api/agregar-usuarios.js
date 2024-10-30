import express from 'express';
import { pool } from './db.js'; // Ajusta la ruta según tu configuración de conexión a la base de datos

const router = express.Router();

router.post('/', async (req, res) => {
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
  } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombreusuario, direcciousuario, coloniausuario, telefonousuario, celularusuario, cedulausuario, claveespecialidad, usuario, password, clavetipousuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombreusuario, direcciousuario, coloniausuario, telefonousuario, celularusuario, cedulausuario, claveespecialidad, usuario, password, clavetipousuario]
    );
    res.status(201).json({ message: 'Usuario agregado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al agregar el usuario:', error);
    res.status(500).json({ message: 'Error al agregar el usuario' });
  }
});

export default router;
