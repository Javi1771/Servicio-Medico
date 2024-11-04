/* eslint-disable @typescript-eslint/no-unused-vars */
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
};

let pool; // eslint-disable-line @typescript-eslint/no-unused-vars

export const connectToDatabase = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('Conexión a la base de datos exitosa');
      console.log("Server:", process.env.DB_SERVER);
    }
    return pool;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

// Exporta `pool` para su uso potencial en otros archivos
export { pool };

export default async function handler(req, res) {
  try {
    const dbPool = await connectToDatabase();
    res.status(200).json({ message: 'Conexión exitosa' });
  } catch (error) {
    res.status(500).json({ message: 'Error de conexión', error });
  }
}
