import sql from 'mssql';

const dbConfig = {
  user: process.env.DB_USER || 'teamSM',
  password: process.env.DB_PASSWORD || 'sm2024',
  server: process.env.DB_SERVER || '172.16.0.3',
  database: process.env.DB_DATABASE || 'PRESIDENCIA',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let pool;

export const connectToDatabase = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('Conexión a la base de datos exitosa');
      console.log("Server:", process.env.DB_SERVER); // Debería mostrar "172.16.0.3"
    }
    return pool;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    res.status(200).json({ message: 'Conexión exitosa' });
  } catch (error) {
    res.status(500).json({ message: 'Error de conexión', error });
  }
}
