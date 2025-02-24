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
            clasificacion,
            presentacion,
            ean,
            piezas,
            maximo,
            minimo,
            medida,
            CASE 
              WHEN piezas <= minimo THEN 'stock bajo'
              WHEN piezas >= maximo THEN 'stock alto'
              ELSE 'stock medio'
            END AS stockStatus
          FROM MEDICAMENTOS
          WHERE estatus = 1 
            AND piezas < maximo
          ORDER BY stockStatus ASC
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
