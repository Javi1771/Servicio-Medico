import { connectToDatabase } from "./connectToDatabase";
import sql from 'mssql';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID de enfermedad crónica no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta combinada para obtener datos de ambas tablas
    const result = await pool
      .request()
      .input("idEnfCronica", sql.Int, parseInt(id, 10))
      .query(`
        SELECT 
          c.cronica,
          r.valor_alcanzado, 
          r.calificacion, 
          r.observacion_valuacion AS observacion_valuacion, 
          r.fecha_registro AS fechaRegistro 
        FROM CRONICAS c
        JOIN REGISTROS_KPIS r ON c.id_enf_cronica = r.id_enf_cronica
        WHERE c.id_enf_cronica = @idEnfCronica
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Datos de la enfermedad no encontrados" });
    }

    // Responder con los datos obtenidos
    const enfermedad = result.recordset[0];
    res.status(200).json(enfermedad);
  } catch (error) {
    console.error("Error al obtener los datos de la enfermedad:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}
