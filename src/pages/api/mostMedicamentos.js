import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  try {
    // Conectar a la base de datos
    const pool = await connectToDatabase();

    // Consulta solo los medicamentos activos y selecciona las columnas necesarias
    const result = await pool.request().query(`
      SELECT CLAVEMEDICAMENTO, MEDICAMENTO, CLASIFICACION, EAN, ESTATUS
      FROM MEDICAMENTOS
      WHERE ESTATUS = 1
    `);

    // Imprimir los resultados en la consola para depuración
    console.log('Medicamentos activos obtenidos:', result.recordset);

    // Enviar la respuesta con los medicamentos activos
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta de medicamentos:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
