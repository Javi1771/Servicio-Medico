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
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavepaciente, clavenomina } = req.query;

  if (!clavenomina && !clavepaciente) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios: clavenomina o clavepaciente" });
  }

  try {
    const pool = await connectToDatabase();

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let query = `
      SELECT 
        d.claveconsulta,
        ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
        d.prioridad,
        d.observaciones,
        d.fecha_asignacion,  
        d.clavepaciente
      FROM detalleEspecialidad d
      LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
      WHERE d.estatus = 2
    `;

    const inputs = [
      { name: "oneMonthAgo", type: sql.DateTime, value: oneMonthAgo },
    ];

    //* Si `clavenomina` está presente, aplica este filtro
    if (clavenomina) {
      query += ` AND d.clavenomina = @clavenomina`;
      inputs.push({ name: "clavenomina", type: sql.NVarChar, value: clavenomina });
    }

    //* Luego, si `clavepaciente` está presente, aplica este filtro adicional
    if (clavepaciente) {
      query += ` AND d.clavepaciente = @clavepaciente`;
      inputs.push({ name: "clavepaciente", type: sql.NVarChar, value: clavepaciente });
    }

    query += ` ORDER BY d.fecha_asignacion DESC`;

    //console.log("Consulta SQL ejecutada:", query);

    const request = pool.request();
    inputs.forEach((input) => {
      request.input(input.name, input.type, input.value);
    });

    const result = await request.query(query);

    //* Formatear la fecha antes de enviar la respuesta
    const historial = result.recordset.map((record) => ({
      ...record,
      fecha_asignacion: formatFecha(record.fecha_asignacion), 
    }));

    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener historial de especialidades:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener historial.", error: error.message });
  }
}
