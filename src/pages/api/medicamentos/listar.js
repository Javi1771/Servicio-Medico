import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = await connectToDatabase();
      //console.log('Conexión a la base de datos exitosa');

      const result = await pool
        .request()
        .query(`
          SELECT 
            m.claveMedicamento AS CLAVEMEDICAMENTO,
            m.medicamento AS MEDICAMENTO,
            m.clasificacion,
            m.presentacion,
            m.ean,
            m.piezas,
            m.maximo,
            m.minimo,
            m.medida,
            u.medida AS unidadMedida,
            CASE 
              WHEN m.piezas <= m.minimo THEN 'stock bajo'
              WHEN m.piezas >= m.maximo THEN 'stock alto'
              ELSE 'stock medio'
            END AS stockStatus
          FROM MEDICAMENTOS AS m
          LEFT JOIN unidades_de_medida AS u ON m.medida = u.id_medida
          WHERE m.estatus = 1
          ORDER BY m.medicamento ASC
        `);

      const medicamentos = result.recordset;
      res.status(200).json(medicamentos);
    } catch (error) {
      console.error('❌ Error al obtener los medicamentos:', error);
      res.status(500).json({ message: 'Error al obtener los medicamentos' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
