import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  const { num_nom } = req.query; 

  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT 
        c.fechaconsulta,
        c.nombrepaciente,
        c.motivoconsulta,
        c.diagnostico,
        c.seasignoaespecialidad,
        e.especialidad AS especialidadinterconsulta
      FROM consultas AS c
      LEFT JOIN especialidades AS e 
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.clavenomina = @num_nom
      ORDER BY c.fechaconsulta DESC
    `;

    const result = await pool.request()
      .input('num_nom', num_nom) //* Número de nómina del paciente
      .query(query);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    res.status(500).json({ message: 'Error al realizar la consulta', error });
  }
}
