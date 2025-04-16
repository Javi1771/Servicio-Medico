import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A"; //! Si la fecha es nula, retorna "N/A"
  
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
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
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const pool = await connectToDatabase();

    //* Fecha de hace un mes
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const query = `
      SELECT 
        c.claveconsulta,
        c.nombrepaciente,
        c.clavenomina,
        c.fechacita,
        c.departamento,
        ISNULL(e.especialidad, 'Sin asignar') AS especialidad
      FROM consultas c
      LEFT JOIN especialidades e 
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.fechaconsulta >= @oneMonthAgo
        AND c.motivoconsulta IS NULL
        AND c.diagnostico IS NULL
        AND c.presionarterialpaciente IS NULL
        AND c.seAsignoIncapacidad IS NULL
        AND c.clavestatus = 2
        AND c.seasignoaespecialidad = 'S'
        AND c.especialidadinterconsulta IS NOT NULL
        AND c.fechacita IS NOT NULL
      ORDER BY c.claveconsulta DESC
    `;

    const request = pool.request();
    request.input("oneMonthAgo", sql.DateTime, oneMonthAgo);

    const result = await request.query(query);
    let historial = result.recordset;

    //* Formatear la columna "fechacita" usando la función formatFecha
    historial = historial.map((row) => ({
      ...row,
      fechacita: formatFecha(row.fechacita)
    }));

    //* Aquí hacemos el log en el servidor
    //console.log("[DEBUG] Datos que se envían al front:", historial);

    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener historial de consultas:", error);
    return res
      .status(500)
      .json({
        message: "Error al obtener historial de consultas.",
        error: error.message
      });
  }
}
