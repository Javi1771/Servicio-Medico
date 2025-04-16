import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  const date = new Date(fecha);

  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

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
        FROM SURTIMIENTOS
        WHERE 
          COSTO IS NOT NULL 
          AND FECHA_DESPACHO IS NOT NULL 
          AND NOMINA IS NOT NULL 
          AND CLAVE_PACIENTE IS NOT NULL
          AND FECHA_DESPACHO BETWEEN @startDate AND @endDate
        GROUP BY NOMINA, CLAVE_PACIENTE, NOMBRE_PACIENTE, FECHA_EMISION
        ORDER BY TOTAL_COSTO DESC
      `);

    //* Formatear la fecha de emisión en los resultados
    const formattedResults = result.recordset.map((record) => {
      //console.log("Fecha original (FECHA_EMISION):", record.FECHA_EMISION);
      const formattedDate = formatFecha(record.FECHA_EMISION);
      //console.log("Fecha formateada (FECHA_EMISION):", formattedDate);

      return {
        ...record,
        FECHA_EMISION: formattedDate,
      };
    });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Error fetching grouped data" });
  }
}
