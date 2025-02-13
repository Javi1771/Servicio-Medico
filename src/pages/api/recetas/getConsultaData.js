import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A"; //* Si la fecha es nula, retorna "N/A"
  
  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
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

export async function getConsultaData(claveConsulta) {
  try {
    console.log("🔍 Conectando a la base de datos...");
    const db = await connectToDatabase();

    console.log("📡 Buscando consulta en la BD con claveconsulta:", claveConsulta);

    //? Consulta a la tabla "consultas"
    const consultaQuery = `
      SELECT 
        c.claveconsulta, c.fechaconsulta, c.clavenomina, 
        c.presionarterialpaciente, c.temperaturapaciente, 
        c.pulsosxminutopaciente, c.respiracionpaciente, 
        c.estaturapaciente, c.pesopaciente, c.glucosapaciente, 
        c.nombrepaciente, c.edad, c.clavestatus, c.motivoconsulta,
        c.elpacienteesempleado, c.parentesco, c.clavepaciente, 
        c.departamento, c.sindicato, c.claveproveedor, c.diagnostico,
        c.seAsignoIncapacidad, c.especialidadInterconsulta,
        p.nombreproveedor, p.cedulaproveedor, pa.PARENTESCO AS parentescoNombre
      FROM consultas c
      LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      LEFT JOIN PARENTESCO pa ON c.parentesco = pa.ID_PARENTESCO
      WHERE c.claveconsulta = @claveConsulta
    `;

    const consultaResult = await db
      .request()
      .input("claveConsulta", sql.Int, claveConsulta)
      .query(consultaQuery);

    let consultaData = consultaResult.recordset[0] || null;

    //* Formatear la fecha de la consulta antes de enviarla
    if (consultaData && consultaData.fechaconsulta) {
      console.log("📅 Fecha original (fechaconsulta):", consultaData.fechaconsulta);
      consultaData.fechaconsulta = formatFecha(consultaData.fechaconsulta);
      console.log("✅ Fecha formateada (fechaconsulta):", consultaData.fechaconsulta);
    }

    //? Consulta a la tabla "detalleReceta"
    const recetaQuery = `
      SELECT 
        dr.indicaciones, dr.cantidad, dr.descMedicamento, dr.piezas,
        m.medicamento AS nombreMedicamento
      FROM detalleReceta dr
      LEFT JOIN MEDICAMENTOS_NEW m ON dr.descMedicamento = m.claveMedicamento
      WHERE dr.folioReceta = @claveConsulta
    `;

    const recetaResult = await db
      .request()
      .input("claveConsulta", sql.VarChar, claveConsulta)
      .query(recetaQuery);

    console.log("✅ Datos de la receta obtenidos:", recetaResult.recordset);

    //? Consulta a la tabla "incapacidades"
    const incapacidadesQuery = `
      SELECT fechaInicial, fechaFinal, claveConsulta
      FROM detalleIncapacidad
      WHERE claveConsulta = @claveConsulta
    `;

    const incapacidadesResult = await db
      .request()
      .input("claveConsulta", sql.VarChar, claveConsulta)
      .query(incapacidadesQuery);

    console.log("✅ Datos de incapacidades obtenidos:", incapacidadesResult.recordset);

    //* Formatear las fechas de incapacidad antes de enviarlas
    if (incapacidadesResult.recordset.length > 0) {
      incapacidadesResult.recordset = incapacidadesResult.recordset.map((incapacidad) => ({
        ...incapacidad,
        fechaInicial: formatFecha(incapacidad.fechaInicial),
        fechaFinal: formatFecha(incapacidad.fechaFinal),
      }));

      console.log("✅ Fechas de incapacidad formateadas:", incapacidadesResult.recordset);
    }

    //? Consulta a la tabla "detalleEspecialidad"
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

    console.log("✅ Datos de detalleEspecialidad obtenidos:", detalleEspecialidadResult.recordset);

    //? Nueva consulta para obtener el último FOLIO_SURTIMIENTO y sumarle 1
    const folioSurtimientoQuery = `
      SELECT ISNULL(MAX(FOLIO_SURTIMIENTO), 0) + 1 AS nuevoFolio FROM SURTIMIENTOS
    `;

    const folioSurtimientoResult = await db.request().query(folioSurtimientoQuery);

    const nuevoFolioSurtimiento = folioSurtimientoResult.recordset[0]?.nuevoFolio || 1;

    console.log("✅ Nuevo FOLIO_SURTIMIENTO obtenido:", nuevoFolioSurtimiento);

    return {
      consulta: consultaData,
      receta: recetaResult.recordset || [],
      incapacidades: incapacidadesResult.recordset || [],
      detalleEspecialidad: detalleEspecialidadResult.recordset || [],
      folioSurtimiento: nuevoFolioSurtimiento, //* Enviar al frontend
    };
  } catch (error) {
    console.error("❌ Error en getConsultaData:", error);
    throw error;
  }
}
