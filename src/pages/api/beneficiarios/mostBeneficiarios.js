import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { num_nom } = req.query;

    if (!num_nom) {
      return res.status(400).json({ error: "Número de nómina es requerido" });
    }

    try {
      const pool = await connectToDatabase();
      const result = await pool.request().input("num_nom", num_nom).query(`
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
            TEL_EMERGENCIA, 
            NOMBRE_EMERGENCIA,
            FOTO_URL,
            ESESTUDIANTE,
            ESDISCAPACITADO,
            VIGENCIA_ESTUDIOS,
            URL_CONSTANCIA,
            URL_CURP,
            URL_ACTA_NAC,
            URL_INE,            
            URL_ACTAMATRIMONIO,
            URL_NOISSTE,
            URL_CONCUBINATO,
            URL_INCAP ,
            URL_ACTADEPENDENCIAECONOMICA,
            FIRMA
        
          FROM BENEFICIARIO
          WHERE NO_NOMINA = @num_nom
        `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      res.status(500).json({ error: "Error fetching beneficiaries" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}