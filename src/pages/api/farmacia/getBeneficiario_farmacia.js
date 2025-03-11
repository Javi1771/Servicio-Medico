import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { num_nomina } = req.body;

    // Validar que num_nomina sea un valor no vacío
    if (!num_nomina || typeof num_nomina !== "string") {
      return res.status(400).json({ message: "El número de nómina debe ser una cadena válida." });
    }

    try {
      const pool = await connectToDatabase();

      // Cambiamos sql.Int a sql.VarChar con el tamaño correspondiente
      const result = await pool
        .request()
        .input("num_nomina", sql.VarChar(10), num_nomina) // Usamos sql.VarChar(10) para el parámetro
        .query(`
          SELECT 
            [NO_NOMINA], 
            [PARENTESCO], 
            [NOMBRE], 
            [A_PATERNO], 
            [A_MATERNO], 
            [SEXO], 
            [ACTIVO], 
            [ALERGIAS], 
            [SANGRE], 
            [ESDISCAPACITADO], 
            [ESESTUDIANTE], 
            [VIGENCIA_ESTUDIOS_INICIO], 
            [VIGENCIA_ESTUDIOS_FIN], 
            [FOTO_URL], 
            [EDAD], 
            [enfermedades_cronicas], 
            [tratamientos], 
            [observaciones]
          FROM BENEFICIARIO
          WHERE [NO_NOMINA] = @num_nomina
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "No se encontraron beneficiarios para este número de nómina." });
      }

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener los beneficiarios:", error);
      res.status(500).json({ message: "Error al obtener los beneficiarios.", error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
