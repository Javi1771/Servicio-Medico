import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.query;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido" });
  }

  try {
    const pool = await connectToDatabase();
    
    const query = `
      SELECT TOP 1 
        FECHA_EMISION,
        NOMINA,
        NOMBRE_PACIENTE,
        EDAD,
        DIAGNOSTICO,
        DEPARTAMENTO,
        FECHA_DESPACHO,
        SINDICATO
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS] 
      WHERE FOLIO_PASE = @folio 
      ORDER BY FOLIO_SURTIMIENTO DESC
    `;

    const result = await pool.request()
      .input("folio", sql.Int, folio)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró el registro" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener la receta:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
