import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET method is allowed" });
  }

  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: "The 'year' parameter is required" });
  }

  const startDate = `${year}-01-01T00:00:00.000Z`;
  const endDate = `${year}-12-31T23:59:59.999Z`;

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("startDate", startDate)
      .input("endDate", endDate)
      .query(`
        SELECT 
          NOMINA,
          CLAVE_PACIENTE,
          NOMBRE_PACIENTE,
          FECHA_EMISION,
          SUM(CAST(COSTO AS FLOAT)) AS TOTAL_COSTO
        FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
        WHERE 
          COSTO IS NOT NULL 
          AND FECHA_DESPACHO IS NOT NULL 
          AND NOMINA IS NOT NULL 
          AND CLAVE_PACIENTE IS NOT NULL
          AND FECHA_DESPACHO BETWEEN @startDate AND @endDate
        GROUP BY NOMINA, CLAVE_PACIENTE, NOMBRE_PACIENTE, FECHA_EMISION
        ORDER BY TOTAL_COSTO DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Error fetching grouped data" });
  }
}