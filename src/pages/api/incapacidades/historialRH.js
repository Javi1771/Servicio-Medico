import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
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

  try {
    const pool = await connectToDatabase();

    //* Obtener la fecha actual en formato YYYY-MM-DD
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    const fechaActualISO = fechaActual.toISOString().split("T")[0];

    //* Fecha límite (15 días antes de la fecha actual)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 15);
    const fechaLimiteISO = fechaLimite.toISOString().split("T")[0];

    //* 🔹 Consulta a la base de datos
    const result = await pool.request().query(`
      SELECT
        i.fecha,
        i.fechainicio,
        i.fechafin,
        i.nomina,
        i.claveincapacidad,
        i.observaciones,
        i.claveconsulta,
        i.nombrepaciente,
        p1.nombreproveedor AS quiencapturo_nombre,
        p2.nombreproveedor AS clavemedico_nombre,
        e1.especialidad AS especialidad_quiencapturo,
        e2.especialidad AS especialidad_clavemedico
      FROM incapacidades i
      LEFT JOIN proveedores p1 ON i.quiencapturo = p1.claveproveedor
      LEFT JOIN proveedores p2 ON i.clavemedico = p2.claveproveedor
      LEFT JOIN especialidades e1 ON p1.claveespecialidad = e1.claveespecialidad
      LEFT JOIN especialidades e2 ON p2.claveespecialidad = e2.claveespecialidad
      WHERE i.estatus = 1
        AND (i.fechafin >= '${fechaActualISO}' OR i.fechafin >= '${fechaLimiteISO}')
      ORDER BY i.fecha DESC
    `);

    //* Formatear las fechas y calcular alertas, días restantes y futuras incapacidades
    const historial = result.recordset.map((item) => {
      const fechaInicio = new Date(item.fechainicio);
      const fechaFin = new Date(item.fechafin);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(0, 0, 0, 0);

      let alerta = null;
      let diasRestantes = null;
      let futura = false;

      //* Verifica si aún no inicia la incapacidad
      if (fechaInicio > fechaActual) {
        futura = true;
      } 
      //* Verifica si la incapacidad está vencida
      else if (fechaFin < fechaActual) {
        const diferenciaDias = Math.floor(
          (fechaActual - fechaFin) / (1000 * 60 * 60 * 24)
        );
        if (diferenciaDias > 0 && diferenciaDias <= 15) {
          alerta = `hace ${diferenciaDias} días`;
        }
      } 
      //* Si está activa, calcula los días restantes basados en la fecha fin
      else {
        diasRestantes = Math.floor(
          (fechaFin - fechaActual) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...item,
        fecha: formatFecha(item.fecha),
        fechainicio: formatFecha(item.fechainicio),
        fechafin: formatFecha(item.fechafin),
        alerta, //* Incapacidad vencida
        diasRestantes, //* Días restantes si está activa
        futura, //* Indica si aún no inicia
      };
    });

    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener incapacidades:", error);
    return res.status(500).json({
      message: "Error al obtener incapacidades",
      error: error.message,
    });
  }
}
