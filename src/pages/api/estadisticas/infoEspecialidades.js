import { connectToDatabase } from "../connectToDatabase";

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

export const getDetallesConsultas = async (fechaHoraInicio, fechaHoraFin) => {
  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT
        c.fechaconsulta,
        c.claveconsulta,
        c.clavenomina,
        c.motivoconsulta,
        c.diagnostico,
        c.nombrepaciente,
        c.edad,
        CASE
          WHEN TRY_CAST(c.parentesco AS INT) IS NOT NULL THEN p.parentesco
          ELSE c.parentesco
        END AS parentesco,
        c.departamento,
        c.costo,
        c.sindicato,
        c.claveproveedor,
        c.fechacita,
        pr.nombreproveedor,
        e.especialidad
      FROM consultas AS c
      LEFT JOIN PARENTESCO AS p 
        ON TRY_CAST(c.parentesco AS INT) = p.ID_PARENTESCO
      LEFT JOIN proveedores AS pr 
        ON c.claveproveedor = pr.claveproveedor
      LEFT JOIN especialidades AS e
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.especialidadinterconsulta IS NOT NULL
        AND c.clavestatus = 2
        AND c.fechaconsulta >= @fechaHoraInicio
        AND c.fechaconsulta <= @fechaHoraFin
      ORDER BY c.fechaconsulta ASC;
    `;

    // console.log("Ejecutando consulta con parámetros:", {
    //   fechaHoraInicio,
    //   fechaHoraFin,
    // });

    const result = await pool
      .request()
      .input("fechaHoraInicio", fechaHoraInicio)
      .input("fechaHoraFin", fechaHoraFin)
      .query(query);

    //* Formatear las fechas en los resultados
    const formattedResults = result.recordset.map((record) => {
      //console.log("Fecha original (fechaconsulta):", record.fechaconsulta);
      const formattedConsulta = formatFecha(record.fechaconsulta);
      //console.log("Fecha formateada (fechaconsulta):", formattedConsulta);

      //console.log("Fecha original (fechacita):", record.fechacita);
      const formattedCita = record.fechacita ? formatFecha(record.fechacita) : null;
      if (formattedCita) {
        //console.log("Fecha formateada (fechacita):", formattedCita);
      }

      return {
        ...record,
        fechaconsulta: formattedConsulta,
        fechacita: formattedCita,
      };
    });

    return formattedResults;
  } catch (error) {
    console.error("Error al obtener los detalles de las consultas:", error);
    throw new Error("Error al obtener los detalles de las consultas");
  }
};

export default async function handler(req, res) {
  const { start, end } = req.query;

  if (!start || !end) {
    res
      .status(400)
      .json({ error: "Faltan parámetros de inicio o fin de fecha" });
    return;
  }

  try {
    //console.log(`Obteniendo detalles de consultas entre ${start} y ${end}`);

    const detalles = await getDetallesConsultas(start, end);

    //console.log("Cantidad de registros obtenidos:", detalles.length);

    res.status(200).json({ detalles });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los detalles de las consultas" });
  }
}
