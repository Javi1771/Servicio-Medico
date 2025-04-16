import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  //* Obtener los valores en UTC para preservar la hora exacta de la base de datos
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
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const query = `
        SELECT 
          c.claveconsulta AS folio,
          ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
          c.nombrepaciente AS paciente,
          c.fechaconsulta AS fecha,
          c.clavenomina AS nomina,
          CASE 
            WHEN de.estatus = 1 THEN 'EN ESPERA PARA ASIGNACIÓN DE FECHA DE CITA' 
            WHEN de.estatus = 2 THEN 'LISTA PARA PASAR CON EL ESPECIALISTA' 
            ELSE 'SIN ESTATUS' 
          END AS estatus
        FROM consultas c
        LEFT JOIN detalleEspecialidad de ON c.claveconsulta = de.claveconsulta
        LEFT JOIN especialidades e ON de.claveespecialidad = e.claveespecialidad
        WHERE c.fechaconsulta >= @sevenDaysAgo
          AND de.claveespecialidad IS NOT NULL
          AND de.estatus = 1
        ORDER BY c.claveconsulta DESC
      `;

      //console.log("📄 Query ejecutado:", query);

      const result = await pool.request()
        .input("sevenDaysAgo", sql.DateTime, sevenDaysAgo)
        .query(query);

      //* Formatear la fecha usando la función formatFecha
      const recordset = result.recordset.map((item) => ({
        ...item,
        fecha: formatFecha(item.fecha)
      }));

      //console.log("✅ Resultado del query:", recordset);

      res.status(200).json(recordset);
    } catch (error) {
      console.error("❌ Error al obtener los datos:", error.message);
      res.status(500).json({ message: "Error al obtener los datos" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
