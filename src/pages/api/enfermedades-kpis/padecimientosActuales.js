import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  const { clavenomina, clavepaciente } = req.query;

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT 
        rec.id_enf_cronica,  
        fecha_registro AS fecha, 
        cronica AS enfermedad, 
        observaciones_cronica AS observaciones
      FROM 
        PACIENTES_CRONICOS AS rec
      INNER JOIN 
        CRONICAS AS c 
      ON 
        rec.id_enf_cronica = c.id_enf_cronica
      WHERE 
        rec.clavenomina = @clavenomina 
      AND 
        rec.clavepaciente = @clavepaciente
    `;
    
    const result = await pool.request()
      .input('clavenomina', clavenomina)
      .input('clavepaciente', clavepaciente)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener padecimientos:", error);
    res.status(500).json({ message: 'Error al obtener padecimientos', error });
  }
}
