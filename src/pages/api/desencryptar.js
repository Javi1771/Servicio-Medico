// pages/api/desencriptarPassword.js

import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';
import crypto from 'crypto';

// Función para desencriptar la contraseña
function decryptPassword(encryptedPassword) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Asegúrate de definir ENCRYPTION_KEY en tu .env
  const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex'); // Asegúrate de definir ENCRYPTION_IV en tu .env

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { usuario } = req.body;

    try {
      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input('usuario', sql.VarChar, usuario)
        .query(`
          SELECT password FROM USUARIOS WHERE usuario = @usuario
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const encryptedPassword = result.recordset[0].password;
      const decryptedPassword = decryptPassword(encryptedPassword);

      res.status(200).json({ password: decryptedPassword });
    } catch (error) {
      console.error('Error al desencriptar la contraseña:', error);
      res.status(500).json({ message: 'Error al desencriptar la contraseña', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
