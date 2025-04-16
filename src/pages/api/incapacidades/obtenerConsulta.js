import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioConsulta } = req.body;
  if (!folioConsulta) {
    return res.status(400).json({ message: "El parámetro folio es requerido" });
  }

  try {
    const pool = await connectToDatabase();
    
    //console.log(`🔍 Buscando consulta con claveconsulta: ${folioConsulta}`);

    //* Buscar la consulta en la base de datos
    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, folioConsulta)
      .query(`
        SELECT clavenomina, seAsignoIncapacidad
        FROM consultas 
        WHERE claveconsulta = @folio 
          AND clavestatus = 2
      `);

    if (consultaResult.recordset.length === 0) {
      //console.log("⚠️ No se encontró la consulta.");
      return res.status(404).json({ message: "No se encontró una consulta con el folio proporcionado." });
    }

    const consulta = consultaResult.recordset[0];

    //console.log("✅ Consulta encontrada:", consulta);

    return res.status(200).json(consulta);
  } catch (error) {
    console.error("❌ Error al buscar la consulta:", error);
    return res.status(500).json({ message: "Error al obtener los datos de la consulta", error: error.message });
  }
}
