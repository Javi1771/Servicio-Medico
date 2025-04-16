import { connectToDatabase } from '../connectToDatabase'; // Ajusta la ruta según tu proyecto

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.warn(`Método ${req.method} no permitido en esta ruta.`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }

  try {
    // Conexión a la base de datos
    const pool = await connectToDatabase();

    //console.log("Ejecutando consulta de enfermedades crónicas...");
    const result = await pool.request()
      .query(`
        SELECT id_enf_cronica, cronica, estatus 
        FROM CRONICAS 
        WHERE estatus = 1 -- Solo enfermedades activas
      `);

    //console.log("Enfermedades crónicas recuperadas exitosamente.");
    res.status(200).json(result.recordset); // Retorna el resultado al cliente
  } catch (error) {
    console.error('Error en la consulta de enfermedades crónicas:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });

    res.status(500).json({ message: 'Error al obtener las enfermedades crónicas.', error: error.message });
  }
}
