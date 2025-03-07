import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = await connectToDatabase();

      const result = await pool.request().query(`
        SELECT 
          id_med_pac AS id,
          ean,
          sustancia,
          clave_nomina,
          nombre_paciente,
          piezas_otorgadas,
          indicaciones,
          tratamiento,
          claveconsulta,
          fecha_otorgacion,
          nombre_medico
        FROM MEDICAMENTO_PACIENTE
      `);

      const movimientos = result.recordset;

      res.status(200).json(movimientos);
    } catch (error) {
      console.error('Error al obtener los movimientos:', error);
      res.status(500).json({ message: 'Error al obtener los movimientos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
