import sql from 'mssql';

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10, // Máximo de conexiones en el pool
    min: 0,  // Mínimo de conexiones
    idleTimeoutMillis: 30000, // Tiempo máximo de inactividad
  },
};

let pool; // Pool global

// Función para conectar a la base de datos
export const connectToDatabase = async () => {
  try {
    if (!pool || !pool.connected) {
      pool = await sql.connect(dbConfig);
      console.log('Conexión a la base de datos exitosa');
      console.log('Servidor:', process.env.DB_SERVER);
    }
    return pool;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }
};

// Función para cerrar la conexión (si es necesario)
export const closeDatabaseConnection = async () => {
  if (pool) {
    await pool.close();
    console.log('Conexión a la base de datos cerrada');
  }
};

// API para probar la conexión
export default async function handler(req, res) {
  try {
    const dbPool = await connectToDatabase(); // Conexión al pool
    if (dbPool.connected) {
      console.log('Pool conectado correctamente'); // Opcional para depuración
    }
    res.status(200).json({ message: 'Conexión exitosa' });
  } catch (error) {
    console.error('Error en la conexión:', error.message);
    res.status(500).json({ message: 'Error de conexión', error: error.message });
  }
}
