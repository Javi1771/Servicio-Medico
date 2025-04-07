import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

/*
 * Función para formatear la fecha con día de la semana
 */
function formatFecha(fecha) {
  if (!fecha) return "N/A";

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

/*
 * Función principal que recibe la claveconsulta, busca en la tabla LABORATORIOS
 * y devuelve los datos con el formato solicitado, separando cada registro de laboratorio.
 */
export async function getConsultaData(claveconsulta) {
  const claveConsultaNum = parseInt(claveconsulta, 10);
  if (isNaN(claveConsultaNum)) {
    throw new Error("El parámetro 'claveconsulta' debe ser un número válido");
  }

  const pool = await connectToDatabase();

  //? 1. Consultar todos los registros de LABORATORIOS para la clave de consulta
  const labQuery = `
    SELECT
      FOLIO_ORDEN_LABORATORIO,
      FECHA_EMISION,
      NOMINA,
      EDAD,
      NOMBRE_PACIENTE,
      ESEMPLEADO,
      DEPARTAMENTO,
      DIAGNOSTICO,
      claveusuario,
      CLAVEMEDICO,
      SINDICATO
    FROM LABORATORIOS
    WHERE CLAVECONSULTA = @claveConsulta
      AND ESTATUS = 1
  `;
  const labResult = await pool
    .request()
    .input("claveConsulta", sql.Int, claveConsultaNum)
    .query(labQuery);

  if (labResult.recordset.length === 0) {
    return null;
  }

  //* Obtener parentesco (si ESEMPLEADO es "N")
  const firstLabOriginal = labResult.recordset[0];
  let parentesco = null;
  if (firstLabOriginal.ESEMPLEADO === "N") {
    const parentescoQuery = `
      SELECT parentesco
      FROM consultas
      WHERE claveconsulta = @claveConsulta
    `;
    const parentescoResult = await pool
      .request()
      .input("claveConsulta", sql.Int, claveConsultaNum)
      .query(parentescoQuery);

    if (parentescoResult.recordset.length > 0) {
      const parentescoId = parentescoResult.recordset[0].parentesco;
      const parenQuery = `
        SELECT PARENTESCO AS parentescoNombre
        FROM PARENTESCO
        WHERE ID_PARENTESCO = @parentescoId
      `;
      const parenResult = await pool
        .request()
        .input("parentescoId", sql.Int, parentescoId)
        .query(parenQuery);

      if (parenResult.recordset.length > 0) {
        parentesco = parenResult.recordset[0].parentescoNombre;
      }
    }
  }

  //? 3. Para cada registro de laboratorio, obtener sus estudios y datos adicionales
  const detalleQuery = `
    SELECT dl.claveEstudio, e.estudio
    FROM detalleLaboratorio dl
    JOIN ESTUDIOS e ON dl.claveEstudio = e.claveEstudio
    WHERE dl.folio_orden_laboratorio = @folioOrden
  `;

  const laboratorios = await Promise.all(
    labResult.recordset.map(async (labRow) => {
      // Formatear la fecha de emisión para cada registro (se hace una sola vez)
      labRow.FECHA_EMISION = formatFecha(labRow.FECHA_EMISION);

      //* Consultar estudios asociados a este laboratorio
      const detalleResult = await pool
        .request()
        .input("folioOrden", sql.Int, labRow.FOLIO_ORDEN_LABORATORIO)
        .query(detalleQuery);

      const estudios = detalleResult.recordset.map((row) => ({
        claveEstudio: row.claveEstudio,
        estudio: row.estudio,
      }));

      //* Consultar nombre del laboratorio (proveedor) basado en CLAVEMEDICO
      let laboratorioNombre = null;
      if (labRow.CLAVEMEDICO) {
        const labProvQuery = `
          SELECT nombreproveedor
          FROM proveedores
          WHERE claveproveedor = @claveMedico
        `;
        const labProvResult = await pool
          .request()
          .input("claveMedico", sql.Int, labRow.CLAVEMEDICO)
          .query(labProvQuery);

        if (labProvResult.recordset.length > 0) {
          laboratorioNombre = labProvResult.recordset[0].nombreproveedor;
        }
      }

      //* Consultar nombre del médico a partir de claveusuario
      let medico = null;
      if (labRow.claveusuario) {
        const userProvQuery = `
          SELECT nombreproveedor
          FROM proveedores
          WHERE claveproveedor = @claveUsuario
        `;
        const userProvResult = await pool
          .request()
          .input("claveUsuario", sql.Int, labRow.claveusuario)
          .query(userProvQuery);

        if (userProvResult.recordset.length > 0) {
          medico = userProvResult.recordset[0].nombreproveedor;
        }
      }

      return {
        FOLIO_ORDEN_LABORATORIO: labRow.FOLIO_ORDEN_LABORATORIO,
        FECHA_EMISION: labRow.FECHA_EMISION,
        NOMINA: labRow.NOMINA,
        EDAD: labRow.EDAD,
        NOMBRE_PACIENTE: labRow.NOMBRE_PACIENTE,
        ESEMPLEADO: labRow.ESEMPLEADO,
        DEPARTAMENTO: labRow.DEPARTAMENTO,
        DIAGNOSTICO: labRow.DIAGNOSTICO,
        claveusuario: labRow.claveusuario,
        CLAVEMEDICO: labRow.CLAVEMEDICO,
        SINDICATO: labRow.SINDICATO,
        laboratorio: laboratorioNombre,
        medico: medico,
        estudios,
      };
    })
  );

  //? 4. Construir la respuesta con los datos comunes y el arreglo de laboratorios
  const firstLab = laboratorios[0];
  const elaborador = laboratorios.length > 0 ? firstLab.medico : null;
  const nombreElaborador = elaborador ? elaborador : "N/A";
  const cookieString = `${nombreElaborador};`;

  const respuesta = {
    NOMINA: firstLab.NOMINA,
    EDAD: firstLab.EDAD,
    NOMBRE_PACIENTE: firstLab.NOMBRE_PACIENTE,
    ESEMPLEADO: firstLab.ESEMPLEADO,
    DEPARTAMENTO: firstLab.DEPARTAMENTO,
    SINDICATO: firstLab.SINDICATO,
    parentesco: parentesco || null,
    laboratorios,
    nombreelaborador: cookieString,
  };

  return { consulta: respuesta };
}

/*
 * Handler de Next.js que responde a la solicitud de la API.
 */
export default async function handler(req, res) {
  try {
    const { claveconsulta } = req.query;
    const data = await getConsultaData(claveconsulta);
    if (!data || !data.consulta) {
      return res.status(404).json({ error: "No se encontró la consulta" });
    }
    //* Imprimir en consola la información completa, sin truncar objetos anidados
    console.dir(data, { depth: null });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error en getConsultaData:", error);
    return res.status(500).json({ error: error.message });
  }
}
