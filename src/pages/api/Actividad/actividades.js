import { connectToDatabase } from "../connectToDatabase";

// Función para formatear la fecha con día de la semana en español
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
    return res.status(405).json({ message: "Método no permitido" });
  }
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT
        A.IdActividad,
        A.IdUsuario,
        A.ClaveConsulta,
        P.nombreproveedor,
        A.Accion,
        A.FechaHora,
        A.DireccionIP,
        A.AgenteUsuario
      FROM ActividadUsuarios AS A
      LEFT JOIN proveedores AS P
        ON A.IdUsuario = P.claveproveedor
      ORDER BY A.FechaHora DESC;
    `);

    const actividades = result.recordset.map((record) => {
      const fechaFormateada = formatFecha(record.FechaHora);
      return {
        ...record,
        FechaHora: fechaFormateada,
      };
    });

    return res.status(200).json(actividades);
  } catch (error) {
    console.error("Error obteniendo actividad:", error);
    return res.status(500).json({ message: "Error obteniendo actividad" });
  }
}
