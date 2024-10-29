// pages/api/connectToDatabase.js
import sql from 'mssql';

// Configuración de la conexión
const dbConfig = {
  user: 'teamSM',          // Usuario de SQL Server
  password: 'sm2024',    // Contraseña
  server: '172.16.0.3',        // Dirección del servidor
  database: 'PRESIDENCIA', // Nombre de la base de datos
  options: {
    encrypt: false,              // Opcional: Dependiendo de tu configuración de SQL Server
    trustServerCertificate: true // Necesario para conexiones locales sin un certificado SSL
  }
};

export default async function handler(req, res) {
  try {
    // Crear una conexión a la base de datos
    const pool = await sql.connect(dbConfig);
    console.log('Conexión a la base de datos exitosa');
    res.status(200).json({ message: 'Conexión exitosa' });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    res.status(500).json({ message: 'Error de conexión', error });
  } finally {
    // Cierra la conexión
    sql.close();
  }
}
