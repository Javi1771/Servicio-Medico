import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
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

  //* Obtener valores en UTC para preservar la hora exacta de la BD
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

  //* Solo desestructuramos 'clavenomina'
  const { clavenomina } = req.query;

  //* Validamos que exista
  if (!clavenomina) {
    return res
      .status(400)
      .json({ message: "Falta el parámetro obligatorio: clavenomina" });
  }

  try {
    const pool = await connectToDatabase();

    //*🔹 Consulta usando solo la clavenomina
    const result = await pool
      .request()
      .input("noNomina", sql.NVarChar, clavenomina)
      .query(`
        SELECT
          fecha,
          fechainicio,
          fechafin,
          nomina,
          claveincapacidad,
          observaciones,
          claveconsulta,
          nombrepaciente
        FROM incapacidades
        WHERE nomina = @noNomina
          AND estatus = 1
        ORDER BY fecha DESC
      `);

    //* Formatear las fechas
    const historial = result.recordset.map((item) => ({
      ...item,
      fecha: formatFecha(item.fecha),
      fechainicio: formatFecha(item.fechainicio),
      fechafin: formatFecha(item.fechafin),
    }));


    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({
      message: "Error al obtener historial",
      error: error.message,
    });
  }
}
