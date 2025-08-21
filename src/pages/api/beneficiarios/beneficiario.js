import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

// Formatea fecha a: "Lunes, 21/08/2025, 3:40 p.m."
function formatFecha(fecha) {
  if (!fecha) return null;
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

// Fin de día en horario LOCAL (para comparar sin “me falta un día”)
const endOfDayLocal = (raw) => {
  if (!raw) return null;

  // Acepta 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
  let y, m, d;
  if (typeof raw === "string" && raw.includes("T")) {
    const [datePart] = raw.split("T");
    [y, m, d] = datePart.split("-").map(Number);
  } else if (typeof raw === "string" && raw.includes("-")) {
    [y, m, d] = raw.split("-").map(Number);
  } else {
    // Si viene Date u otro, construye y ajusta a fin de día
    const tmp = new Date(raw);
    return new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), 23, 59, 59, 999);
  }

  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }

  const { nomina } = req.body;

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("nomina", sql.VarChar, nomina)
      .query(`
        SELECT 
          B.ID_BENEFICIARIO, 
          B.NOMBRE, 
          B.A_PATERNO, 
          B.A_MATERNO, 
          B.F_NACIMIENTO, 
          B.ESDISCAPACITADO,
          B.ESESTUDIANTE,
          B.FOTO_URL,
          B.VIGENCIA_ESTUDIOS,        -- fecha cruda desde SQL (sin FORMAT)
          B.ACTIVO,
          B.PARENTESCO,
          B.URL_INCAP,
          P.ID_PARENTESCO AS ID_PARENTESCO,
          P.PARENTESCO AS PARENTESCO_DESC,
          DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()) AS YEARS,
          DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()) AS MONTHS
        FROM BENEFICIARIO B
        LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
        WHERE B.NO_NOMINA = @nomina
      `);

    const rows = result.recordset || [];

    // Solo mapear/formatear (SIN validar/filtrar)
    const beneficiarios = rows.map((b) => {
      // Edad detallada (años/meses/días)
      const hoy = new Date();
      const fn = b.F_NACIMIENTO ? new Date(b.F_NACIMIENTO) : null;

      let years = b.YEARS ?? 0;
      let months = b.MONTHS ?? 0;
      let days = 0;

      if (fn) {
        days = hoy.getDate() - fn.getDate();
        if (days < 0) {
          months -= 1;
          const lastMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
          days += lastMonth.getDate();
        }
        if (months < 0) {
          years -= 1;
          months += 12;
        }
      }

      // Fin de día local para vigencia (útil para el front)
      const vigenciaEod = endOfDayLocal(b.VIGENCIA_ESTUDIOS);

      return {
        ...b,

        // Formateos “bonitos” para UI:
        F_NACIMIENTO_FORMAT: formatFecha(b.F_NACIMIENTO),
        VIGENCIA_ESTUDIOS_FORMAT: formatFecha(b.VIGENCIA_ESTUDIOS),

        // Apoyos para comparar en el front (sin parseo):
        VIGENCIA_ESTUDIOS_EOD_TS: vigenciaEod ? vigenciaEod.getTime() : null, // número
        VIGENCIA_ESTUDIOS_EOD_ISO: vigenciaEod ? vigenciaEod.toISOString() : null, // ISO

        // Edad detallada
        YEARS: years,
        MONTHS: months,
        DAYS: days,
        EDAD: `${years} años, ${months} meses, ${days} días`,
      };
    });

    if (beneficiarios.length === 0) {
      return res.status(200).json({ beneficiarios: [] }); // sin error, pero vacío
    }

    return res.status(200).json({ beneficiarios });
  } catch (error) {
    console.error("Error al buscar beneficiarios:", error);
    return res.status(500).json({ message: "Error de conexión", error });
  }
}
