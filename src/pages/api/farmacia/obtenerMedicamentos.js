import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = await connectToDatabase();
      console.log('Conexión a la base de datos exitosa');

      const result = await pool
        .request()
        .query(`
          SELECT 
            claveMedicamento AS id,
            medicamento,
            clasificación,
            presentación,
            ean,
            piezas
          FROM MEDICAMENTOS_NEW
        `);

      const medicamentos = result.recordset;
      res.status(200).json(medicamentos);
    } catch (error) {
      console.error('Error al obtener los medicamentos:', error);
      res.status(500).json({ message: 'Error al obtener los medicamentos' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
