// /api/recetas/getConsultaData.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
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

//* Función para validar recursivamente un objeto plano
function validarCampos(obj, nombrePadre = "") {
  const faltantes = [];
  for (const [key, value] of Object.entries(obj)) {
    const nombreCompleto = nombrePadre ? `${nombrePadre}.${key}` : key;
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      faltantes.push(nombreCompleto);
    }
  }
  return faltantes;
}

//* Función para validar arrays de objetos
function validarArray(arr, nombreArray) {
  const faltantes = [];
  arr.forEach((item, index) => {
    for (const [key, value] of Object.entries(item)) {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        faltantes.push(`${nombreArray}[${index + 1}].${key}`);
      }
    }
  });
  return faltantes;
}

export async function getConsultaData(claveConsulta) {
  try {
    const db = await connectToDatabase();

    console.log("📡 Buscando consulta en la BD con claveconsulta:", claveConsulta);

    //? Consulta principal
    const consultaQuery = `
      SELECT 
        c.claveconsulta, c.fechaconsulta, c.clavenomina, 
        c.presionarterialpaciente, c.temperaturapaciente, 
        c.pulsosxminutopaciente, c.respiracionpaciente, 
        c.estaturapaciente, c.pesopaciente, c.glucosapaciente, 
        c.nombrepaciente, c.edad, c.clavestatus, c.motivoconsulta,
        c.elpacienteesempleado, c.parentesco, c.clavepaciente, 
        c.departamento, c.sindicato, c.claveproveedor, c.diagnostico,
        c.seAsignoIncapacidad, c.especialidadinterconsulta, c.seasignoaespecialidad,
        c.fechacita, p.nombreproveedor, p.cedulaproveedor, c.alergias,
        pa.PARENTESCO AS parentescoNombre, 
        es.especialidad AS especialidadNombre
      FROM consultas c
      LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      LEFT JOIN PARENTESCO pa ON c.parentesco = pa.ID_PARENTESCO
      LEFT JOIN especialidades es ON c.especialidadinterconsulta = es.claveespecialidad
      WHERE c.claveconsulta = @claveConsulta
    `;
    const consultaResult = await db
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .query(consultaQuery);

    let consultaData = consultaResult.recordset[0] || null;

    if (consultaData?.fechaconsulta) {
      consultaData.fechaconsulta = formatFecha(consultaData.fechaconsulta);
    }
    if (consultaData?.fechacita) {
      consultaData.fechacita = formatFecha(consultaData.fechacita);
    }

    //? Receta
    const recetaQuery = `
      SELECT 
        dr.indicaciones, 
        dr.cantidad, 
        dr.descMedicamento AS idMedicamento, 
        dr.piezas,
        dr.seAsignoResurtimiento,
        dr.cantidadMeses,
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(m.medicamento, ', ', ','), 
              ',', ', '
            ),
            ' / ', '/'
          ),
          '/', ' / '
        ) AS nombreMedicamento,
        m.clasificacion
      FROM detalleReceta dr
      LEFT JOIN MEDICAMENTOS m ON dr.descMedicamento = m.claveMedicamento
      WHERE dr.folioReceta = @claveConsulta
    `;
    const recetaResult = await db
      .request()
      .input("claveConsulta", sql.VarChar, claveConsulta)
      .query(recetaQuery);

    //? Incapacidades
    const incapacidadesQuery = `
      SELECT fechaInicial, fechaFinal, claveConsulta
      FROM detalleIncapacidad
      WHERE claveConsulta = @claveConsulta
    `;
    const incapacidadesResult = await db
      .request()
      .input("claveConsulta", sql.VarChar, claveConsulta)
      .query(incapacidadesQuery);

    const incapacidades = incapacidadesResult.recordset.map((i) => ({
      ...i,
      fechaInicial: formatFecha(i.fechaInicial),
      fechaFinal: formatFecha(i.fechaFinal),
    }));

    //? Especialidad
    const detalleEspecialidadQuery = `
      SELECT 
      de.observaciones, de.claveespecialidad,
      e.especialidad AS nombreEspecialidad
      FROM detalleEspecialidad de
      LEFT JOIN especialidades e ON de.claveespecialidad = e.claveespecialidad
      WHERE claveconsulta = @claveConsulta
    `;
    const detalleEspecialidadResult = await db
      .request()
      .input("claveConsulta", sql.VarChar, claveConsulta)
      .query(detalleEspecialidadQuery);

    //? Folio surtimiento
    const folioSurtimientoQuery = `
      SELECT FOLIO_SURTIMIENTO 
      FROM SURTIMIENTOS 
      WHERE FOLIO_PASE = @claveConsulta
    `;
    const folioSurtimientoResult = await db
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .query(folioSurtimientoQuery);

    const folioSurtimiento =
      folioSurtimientoResult.recordset[0]?.FOLIO_SURTIMIENTO || null;

    //? Validación completa de campos
    const faltantes = [
      ...validarCampos(consultaData || {}, "consulta"),
      ...validarArray(recetaResult.recordset || [], "receta"),
      ...validarArray(incapacidades || [], "incapacidades"),
      ...validarArray(detalleEspecialidadResult.recordset || [], "detalleEspecialidad"),
    ];

    return {
      consulta: consultaData,
      receta: recetaResult.recordset || [],
      incapacidades,
      detalleEspecialidad: detalleEspecialidadResult.recordset || [],
      folioSurtimiento,
      ...(faltantes.length > 0 && { faltantes }),
    };
  } catch (error) {
    console.error("❌ Error en getConsultaData:", error);
    throw error;
  }
}
