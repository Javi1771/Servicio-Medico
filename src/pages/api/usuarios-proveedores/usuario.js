import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();

    //* Obtener el parámetro de búsqueda (usuario) de la query string
    const { usuario } = req.query;

    //* Construir la consulta SQL según la presencia del parámetro "usuario"
    let query = 'SELECT * FROM proveedores WHERE activo = \'S\'';
    if (usuario) {
      query += ` AND usuario = '${usuario}'`; //* Filtrar por usuario exacto
    }

    //* Ejecutar la consulta
    const result = await pool.request().query(query);

    //console.log('Resultados de la consulta:', result.recordset);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
