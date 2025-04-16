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

export const getConsultasPorEspecialidad = async (
  claveEspecialidad,
  startDate,
  endDate
) => {
  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT 
        c.clavenomina, 
        c.claveconsulta, 
        c.clavepaciente, 
        c.nombrepaciente, 
        c.edad, 
        c.fechaconsulta, 
        c.costo, 
        c.fechacita, 
        c.sindicato, 
        c.departamento, 
        c.claveproveedor,
        pr.nombreproveedor
      FROM consultas AS c
      LEFT JOIN proveedores AS pr ON c.claveproveedor = pr.claveproveedor
      WHERE c.especialidadinterconsulta = @claveEspecialidad
        AND c.clavestatus = 2
        ${
          startDate && endDate
            ? "AND c.fechaconsulta BETWEEN @startDate AND @endDate"
            : ""
        }
      ORDER BY c.fechaconsulta ASC;
    `;

    // console.log("Ejecutando consulta con parámetros:", {
    //   claveEspecialidad,
    //   startDate,
    //   endDate,
    // });

    const request = pool.request().input("claveEspecialidad", claveEspecialidad);

    if (startDate && endDate) {
      request.input("startDate", startDate).input("endDate", endDate);
    }

    const result = await request.query(query);

    //* Formatear fechas en los resultados
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
    console.error("Error al obtener las consultas por especialidad:", error);
    throw new Error("Error al obtener las consultas por especialidad");
  }
};

export const getEspecialidades = async () => {
  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT * 
      FROM especialidades 
      WHERE estatus = 1 
      ORDER BY especialidad ASC
    `;

    const result = await pool.request().query(query);

    return result.recordset;
  } catch (error) {
    console.error("Error al obtener las especialidades:", error);
    throw new Error("Error al obtener las especialidades");
  }
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Solo se permiten solicitudes GET" });
  }

  const { claveespecialidad, startDate, endDate } = req.query;

  try {
    if (!claveespecialidad) {
      //console.log("Obteniendo especialidades...");
      const especialidades = await getEspecialidades();
      return res.status(200).json({ especialidades });
    }

    // console.log(
    //   `Obteniendo consultas para especialidad ${claveespecialidad}...`
    // );
    const consultas = await getConsultasPorEspecialidad(
      claveespecialidad,
      startDate,
      endDate
    );

    if (!consultas || consultas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron consultas para esta especialidad" });
    }

    return res.status(200).json({ consultas });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res
      .status(500)
      .json({ error: "Error al procesar la solicitud" });
  }
}
