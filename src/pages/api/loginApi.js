import sql from 'mssql';
import bcrypt from 'bcrypt';
import { RESPONSE_LIMIT_DEFAULT } from 'next/dist/server/api-utils';

const config = {
  user: 'teamSM',
  password: 'sm2024',
  server: '172.16.0.3',
  database: 'PRESIDENCIA',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { usuario, password } = req.body;

  const bcrypt = require('bcrypt');
const sql = require('mssql'); // Asegúrate de importar el módulo adecuado


try {
    // Conectar a la base de datos
    await sql.connect(config);
    console.log("Conectado a la base de datos para login");

    // Buscar al usuario en la base de datos
    const result = await sql.query`SELECT password FROM USUARIOS WHERE usuario = ${usuario}`;
    const user = result.recordset[0];

    if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar si la contraseña ingresada coincide con la almacenada en texto plano
    if (user.password === password) {
        // Si coincide, encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar la contraseña en la base de datos con la versión encriptada
        await sql.query`UPDATE USUARIOS SET password = ${hashedPassword} WHERE usuario = ${usuario}`;

        return res.status(200).json({ success: true, message: 'Contraseña encriptada y login exitoso' });
    }

    // Si la contraseña no coincide en texto plano, verificar si está encriptada
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
        return res.status(200).json({ success: true, message: 'Login exitoso' });
    } else {
        return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
} catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
} finally {
    // Opcional: Cerrar la conexión a la base de datos si es necesario
}
   // Opcional: Cerrar la conexión a la base de datos si es necesario
};

