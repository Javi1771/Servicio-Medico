import { connectToDatabase } from "../connectToDatabase";

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

  return `${diaSemana}, ${dia}/${mes}/${año}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { idBeneficiario } = req.query;

  if (!idBeneficiario) {
    return res
      .status(400)
      .json({ error: "ID de beneficiario no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool.request()
      .input("idBeneficiario", idBeneficiario)
      .query(`
        SELECT 
          ID_BENEFICIARIO, 
          NO_NOMINA, 
          PARENTESCO, 
          NOMBRE, 
          A_PATERNO, 
          A_MATERNO, 
          SEXO, 
          F_NACIMIENTO, 
          ACTIVO, 
          ALERGIAS, 
          SANGRE,
          ESESTUDIANTE,
          ESDISCAPACITADO,
          VIGENCIA_ESTUDIOS, 
          TEL_EMERGENCIA, 
          NOMBRE_EMERGENCIA,
          FOTO_URL,
          URL_CONSTANCIA,
          URL_CURP,
          URL_ACTA_NAC,
          URL_INE,
          URL_ACTAMATRIMONIO,  
          URL_NOISSTE,
          URL_CONCUBINATO,
          URL_INCAP,
          FIRMA
        FROM BENEFICIARIO
        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Beneficiario no encontrado" });
    }

    const beneficiario = result.recordset[0];

    //* Formatear F_NACIMIENTO con día de la semana
    if (beneficiario.F_NACIMIENTO) {
      beneficiario.F_NACIMIENTO = formatFecha(beneficiario.F_NACIMIENTO);
    }

    res.status(200).json(beneficiario);
  } catch (error) {
    console.error("Error al obtener el beneficiario:", error);
    res.status(500).json({ error: "Error al obtener el beneficiario" });
  }
}
