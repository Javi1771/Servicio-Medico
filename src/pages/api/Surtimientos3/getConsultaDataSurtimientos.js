import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

// formatea fechas
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  const diasSemana = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2,"0");
  const mes = String(date.getUTCMonth()+1).padStart(2,"0");
  const año = date.getUTCFullYear();
  let horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2,"0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  horas = horas % 12 === 0 ? 12 : horas % 12;
  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas}:${minutos} ${periodo}`;
}

/**
 * Esta función la usaremos en diferentes endpoints para leer
 * consulta, receta, incapacidades, detalleEspecialidad y el
 * ÚLTIMO folio de surtimiento.
 */
export async function getConsultaDataSurtimientos(claveconsulta) {
  const db = await connectToDatabase();

  // 1) consulta principal
  const consultaQuery = `
    SELECT c.claveconsulta, c.fechaconsulta, c.clavenomina,
           c.presionarterialpaciente, c.temperaturapaciente,
           c.pulsosxminutopaciente, c.respiracionpaciente,
           c.estaturapaciente, c.pesopaciente, c.glucosapaciente,
           c.nombrepaciente, c.edad, c.clavestatus, c.motivoconsulta,
           c.elpacienteesempleado, c.parentesco, c.clavepaciente,
           c.departamento, c.sindicato, c.claveproveedor, c.diagnostico,
           c.seAsignoIncapacidad, c.especialidadinterconsulta, c.seasignoaespecialidad,
           c.fechacita, p.nombreproveedor, p.cedulaproveedor,
           pa.PARENTESCO      AS parentescoNombre,
           es.especialidad   AS especialidadNombre
    FROM consultas c
    LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
    LEFT JOIN PARENTESCO pa ON c.parentesco = pa.ID_PARENTESCO
    LEFT JOIN especialidades es ON c.especialidadinterconsulta = es.claveespecialidad
    WHERE c.claveconsulta = @claveconsulta
  `;
  const consultaResult = await db
    .request()
    .input("claveconsulta", sql.Int, claveconsulta)
    .query(consultaQuery);
  const consultaData = consultaResult.recordset[0] || null;

  if (consultaData?.fechaconsulta) {
    consultaData.fechaconsulta = formatFecha(consultaData.fechaconsulta);
  }
  if (consultaData?.fechacita) {
    consultaData.fechacita = formatFecha(consultaData.fechacita);
  }

  // 2) detalleReceta (mesclado con formato REPLACE y filtros de surtimiento)
  const recetaQuery = `
    SELECT
      dr.idDetalleReceta,
      dr.indicaciones,
      dr.cantidad,
      dr.descMedicamento AS idMedicamento,
      dr.piezas,
      dr.seAsignoResurtimiento,
      dr.cantidadMeses,
      dr.surtimientoActual,
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(m.medicamento, ', ', ','),
            ',', ' , '
          ),
          ' / ', '/'
        ),
        '/', ' / '
      ) AS nombreMedicamento,
      m.clasificacion
    FROM detalleReceta dr
    LEFT JOIN MEDICAMENTOS m ON dr.descMedicamento = m.claveMedicamento
    WHERE dr.folioReceta = @claveconsulta
      AND dr.seAsignoResurtimiento = 1
      AND dr.surtimientoActual < dr.cantidadMeses
  `;
  const recetaResult = await db
    .request()
    .input("claveconsulta", sql.VarChar, claveconsulta)
    .query(recetaQuery);

  // 3) incapacidades
  const incapQuery = `
    SELECT fechaInicial, fechaFinal, claveConsulta
    FROM detalleIncapacidad
    WHERE claveConsulta = @claveconsulta
  `;
  const incapResult = await db
    .request()
    .input("claveconsulta", sql.VarChar, claveconsulta)
    .query(incapQuery);
  const incapacidades = incapResult.recordset.map(i => ({
    ...i,
    fechaInicial: formatFecha(i.fechaInicial),
    fechaFinal:   formatFecha(i.fechaFinal),
  }));

  // 4) detalleEspecialidad
  const detEspQuery = `
    SELECT de.observaciones,
           de.claveespecialidad,
           e.especialidad AS nombreEspecialidad
    FROM detalleEspecialidad de
    LEFT JOIN especialidades e ON de.claveespecialidad = e.claveespecialidad
    WHERE claveconsulta = @claveconsulta
  `;
  const detEspResult = await db
    .request()
    .input("claveconsulta", sql.VarChar, claveconsulta)
    .query(detEspQuery);

  // 5) último folio surtimiento
  const folioSurtQuery = `
    SELECT TOP 1 FOLIO_SURTIMIENTO
    FROM SURTIMIENTOS
    WHERE FOLIO_PASE = @claveconsulta
    ORDER BY FOLIO_SURTIMIENTO DESC
  `;
  const folioSurtResult = await db
    .request()
    .input("claveconsulta", sql.Int, claveconsulta)
    .query(folioSurtQuery);
  const folioSurtimiento = folioSurtResult.recordset[0]?.FOLIO_SURTIMIENTO || null;

  return {
    consulta:            consultaData,
    receta:              recetaResult.recordset,
    incapacidades,
    detalleEspecialidad: detEspResult.recordset,
    folioSurtimiento,
  };
}

/**
 * Este handler expone la misma lógica por HTTP GET,
 * pero la parte “pesada” está en getConsultaDataSurtimientos().
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }
  const { claveconsulta } = req.query;
  if (!claveconsulta) {
    return res.status(400).json({ message: "Falta parámetro claveconsulta" });
  }
  try {
    const data = await getConsultaDataSurtimientos(claveconsulta);
    if (!data.consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("🔴 Error en getConsultaDataSurtimientos API:", err);
    return res.status(500).json({ message: "Error interno", error: err.message });
  }
}
