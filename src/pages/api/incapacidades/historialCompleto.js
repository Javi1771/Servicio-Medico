import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana en español
function formatFecha(fecha) {
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
    
    //* Definir la fecha actual para las comparaciones
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    //* Consulta a la base de datos con joins y condiciones
    const result = await pool.request().query(`
      SELECT
        i.claveincapacidad,
        i.folioincapacidad,
        i.fecha,
        i.fechainicio,
        i.fechafin,
        i.nomina,
        i.nombrepaciente,
        i.departamento,
        i.observaciones,
        i.edad,
        i.quiencapturo,
        i.claveconsulta,
        i.claveMedico,
        p1.nombreproveedor AS quiencapturo_nombre,
        p2.nombreproveedor AS clavemedico_nombre,
        e1.especialidad AS especialidad_quiencapturo,
        e2.especialidad AS especialidad_clavemedico
      FROM incapacidades i
      LEFT JOIN proveedores p1 ON i.quiencapturo = p1.claveproveedor
      LEFT JOIN proveedores p2 ON i.claveMedico = p2.claveproveedor
      LEFT JOIN especialidades e1 ON p1.claveespecialidad = e1.claveespecialidad
      LEFT JOIN especialidades e2 ON p2.claveespecialidad = e2.claveespecialidad
      WHERE i.estatus = 1
      ORDER BY i.claveincapacidad DESC
    `);

    //* Procesar y formatear los datos obtenidos
    const historial = result.recordset.map((item) => {
      //* Convertir fechas a objetos Date y establecer la hora a 00:00:00 para comparaciones
      const fechaInicio = new Date(item.fechainicio);
      const fechaFin = new Date(item.fechafin);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(0, 0, 0, 0);

      let alerta = null;
      let diasRestantes = null;
      let futura = false;

      //* Verificar si la incapacidad aún no ha iniciado
      if (fechaInicio > fechaActual) {
        futura = true;
      } 
      //* Verificar si la incapacidad está vencida (y dentro de los últimos 15 días)
      else if (fechaFin < fechaActual) {
        const diferenciaDias = Math.floor(
          (fechaActual - fechaFin) / (1000 * 60 * 60 * 24)
        );
        if (diferenciaDias > 0 && diferenciaDias <= 15) {
          alerta = `hace ${diferenciaDias} días`;
        }
      } 
      //* Incapacidad activa, calcular días restantes
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
        alerta,       //* Indica si la incapacidad está vencida
        diasRestantes,//* Días restantes si la incapacidad está activa
        futura        //* Indica si la incapacidad aún no ha iniciado
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
