// pages/api/pendientes.js
import { connectToDatabase } from '../../api/connectToDatabase';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT TOP 100
        [FOLIO_SURTIMIENTO],
        [FOLIO_PASE],
        [FECHA_EMISION],
        [NOMINA],
        [CLAVE_PACIENTE],
        [NOMBRE_PACIENTE],
        [EDAD],
        [ESEMPLEADO],
        [CLAVEMEDICO],
        [DIAGNOSTICO],
        [DEPARTAMENTO],
        [ESTATUS],
        [COSTO],
        [FECHA_DESPACHO],
        [SINDICATO],
        [claveusuario]
      FROM [SURTIMIENTOS]
      WHERE [ESTATUS] = 1
      ORDER BY [FOLIO_SURTIMIENTO] DESC
    `);

    // Formatear el campo FECHA_EMISION en cada registro
    const registrosFormateados = result.recordset.map((item) => ({
      ...item,
      FECHA_EMISION: formatFecha(item.FECHA_EMISION)
    }));

    res.status(200).json(registrosFormateados);
  } catch (error) {
    console.error("Error al obtener recetas pendientes:", error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
}
