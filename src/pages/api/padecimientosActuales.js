import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  const { clavenomina, nombrePaciente } = req.query;

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT 
        rec.id_enf_cronica,  
        fecha_registro AS fecha, 
        cronica AS enfermedad, 
        observaciones_cronica AS observaciones
      FROM 
        Registro_Enfermedades_Cronicas AS rec
      INNER JOIN 
        CRONICAS AS c 
      ON 
        rec.id_enf_cronica = c.id_enf_cronica
      WHERE 
        rec.clavenomina = @clavenomina 
      AND 
        rec.nombre_paciente = @nombrePaciente
    `;
    
    const result = await pool.request()
      .input('clavenomina', clavenomina)
      .input('nombrePaciente', nombrePaciente)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener padecimientos:", error);
    res.status(500).json({ message: 'Error al obtener padecimientos', error });
  }
}
