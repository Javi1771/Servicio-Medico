import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const pool = await connectToDatabase();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    //* Obtener clavestatus estrictamente de la URL
    if (!req.query.clavestatus) {
      return res.status(400).json({ message: "Se requiere el parámetro 'clavestatus'" });
    }

    const clavestatus = parseInt(req.query.clavestatus);

    //* Validar que solo acepte clavestatus 0, 1 o 2
    if (![0, 1, 2].includes(clavestatus)) {
      return res.status(400).json({ message: "El valor de 'clavestatus' debe ser 0, 1 o 2" });
    }

    //* Ejecutar la consulta SQL con el filtro exacto de clavestatus
    const result = await pool
      .request()
      .input("startOfDay", sql.DateTime, startOfDay)
      .input("endOfDay", sql.DateTime, endOfDay)
      .input("clavestatus", sql.Int, clavestatus)
      .query(`
        SELECT TOP 100
          consultas.*, 
          P.PARENTESCO AS parentesco_desc 
        FROM consultas
        LEFT JOIN PARENTESCO P 
          ON TRY_CAST(consultas.parentesco AS SMALLINT) = P.ID_PARENTESCO
        WHERE consultas.clavestatus = @clavestatus 
          AND consultas.fechaconsulta >= @startOfDay 
          AND consultas.fechaconsulta <= @endOfDay
          AND consultas.fechacita IS NULL
        ORDER BY consultas.claveconsulta DESC
      `);

    const consultas = result.recordset;

    //* Responder con los resultados
    res.status(200).json({ consultas });
    //console.log(`Consultas obtenidas con clavestatus=${clavestatus}:`, consultas.length);
  } catch (error) {
    console.error("Error al cargar consultas del día:", error);
    res.status(500).json({ message: "Error al cargar consultas del día" });
  }
}
