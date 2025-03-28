// /api/getBeneficiary.js
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { idBeneficiario } = req.query;

  if (!idBeneficiario) {
    return res
      .status(400)
      .json({ error: "ID de beneficiario no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input("idBeneficiario", idBeneficiario)
      .query(`
        SELECT 
          ID_BENEFICIARIO, 
          NO_NOMINA, 
          PARENTESCO, 
          NOMBRE, 
          A_PATERNO, 
          A_MATERNO, 
          SEXO, 
          F_NACIMIENTO, 
          ACTIVO, 
          ALERGIAS, 
          SANGRE,
          ESESTUDIANTE,
          ESDISCAPACITADO,
          VIGENCIA_ESTUDIOS, 
          TEL_EMERGENCIA, 
          NOMBRE_EMERGENCIA,
          FOTO_URL,
          URL_CONSTANCIA,
          URL_CURP,
          URL_ACTA_NAC,
          URL_INE,
          URL_ACTAMATRIMONIO,  
          URL_NOISSTE,
          URL_CONCUBINATO,
          URL_INCAP,
          FIRMA
          
        FROM BENEFICIARIO
        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Beneficiario no encontrado" });
    }

    // Retornar el beneficiario encontrado
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener el beneficiario:", error);
    res.status(500).json({ error: "Error al obtener el beneficiario" });
  }
}
