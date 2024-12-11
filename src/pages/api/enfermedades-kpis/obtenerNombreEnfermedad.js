import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ error: "ID de enfermedad crónica no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();

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
        WHERE c.id_enf_cronica = @idEnfCronica AND r.estatus = 1
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "Datos de la enfermedad con estatus 1 no encontrados" });
    }

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener los datos de la enfermedad:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}
