import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const pool = await connectToDatabase();

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const clavestatus = req.query.clavestatus ? parseInt(req.query.clavestatus) : 1;

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
        LEFT JOIN PARENTESCO P ON consultas.parentesco = P.ID_PARENTESCO
        WHERE consultas.clavestatus = @clavestatus 
          AND consultas.fechaconsulta >= @startOfDay 
          AND consultas.fechaconsulta <= @endOfDay
        ORDER BY consultas.fechaconsulta ASC
      `);

    res.status(200).json({ consultas: result.recordset });
    console.log("Número de consultas obtenidas:", result.recordset.length);
  } catch (error) {
    console.error("Error al cargar consultas del día:", error);
    res.status(500).json({ message: "Error al cargar consultas del día" });
  }
}
