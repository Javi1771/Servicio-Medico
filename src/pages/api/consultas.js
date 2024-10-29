// pages/api/consultaEjemplo.js
import sql from 'mssql';

const dbConfig = {
  user: 'teamSM',           
  password: 'sm2024',       
  server: '172.16.0.3',            
  database: 'PRESIDENCIA',  
  options: {
    encrypt: false,                 
    trustServerCertificate: true   
  }
};

export default async function handler(req, res) {
  try {
    // Conectar a la base de datos
    const pool = await sql.connect(dbConfig);
    
    // Realizar la consulta
    const result = await pool.request().query('SELECT * FROM trabajadores'); // Cambia 'tu_tabla' por el nombre de tu tabla

    // Imprimir los resultados en la consola
    console.log('Resultados de la consulta:', result.recordset);

    // Enviar la respuesta al cliente
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  } finally {
    // Cerrar la conexión
    await sql.close();
  }
}
