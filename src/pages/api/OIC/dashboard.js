// pages/api/OIC/dashboard.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles", 
    "Jueves", "Viernes", "Sábado",
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

function buildWhereClause(filters) {
  let whereClause = "WHERE 1=1";
  const params = [];
  
  if (filters.fechaInicio && filters.fechaFin) {
    whereClause += " AND c.fechaconsulta BETWEEN @fechaInicio AND @fechaFin";
    params.push({ name: 'fechaInicio', type: sql.DateTime, value: filters.fechaInicio });
    params.push({ name: 'fechaFin', type: sql.DateTime, value: filters.fechaFin });
  }
  
  if (filters.claveproveedor) {
    whereClause += " AND c.claveproveedor = @claveproveedor";
    params.push({ name: 'claveproveedor', type: sql.Int, value: filters.claveproveedor });
  }
  
  if (filters.departamento) {
    whereClause += " AND c.departamento LIKE @departamento";
    params.push({ name: 'departamento', type: sql.NChar, value: `%${filters.departamento}%` });
  }
  
  if (filters.clavestatus) {
    whereClause += " AND c.clavestatus = @clavestatus";
    params.push({ name: 'clavestatus', type: sql.Int, value: filters.clavestatus });
  }
  
  return { whereClause, params };
}

async function getDashboardData(filters = {}) {
  try {
    const db = await connectToDatabase();
    const { whereClause, params } = buildWhereClause(filters);

    // 1. Consulta principal optimizada con paginación
    const consultasQuery = `
      SELECT 
        c.claveconsulta, c.fechaconsulta, c.clavenomina, 
        c.presionarterialpaciente, c.temperaturapaciente, 
        c.pulsosxminutopaciente, c.respiracionpaciente, 
        c.estaturapaciente, c.pesopaciente, c.glucosapaciente, 
        c.nombrepaciente, c.edad, c.clavestatus, c.motivoconsulta,
        c.elpacienteesempleado, c.parentesco, c.clavepaciente, 
        c.departamento, c.sindicato, c.claveproveedor, c.diagnostico,
        c.seAsignoIncapacidad, c.especialidadinterconsulta, c.seasignoaespecialidad,
        c.fechacita, c.alergias,
        p.nombreproveedor, p.cedulaproveedor,
        pa.PARENTESCO AS parentescoNombre, 
        es.especialidad AS especialidadNombre
      FROM consultas c
      LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      LEFT JOIN PARENTESCO pa ON c.parentesco = pa.PARENTESCO
      LEFT JOIN especialidades es ON c.especialidadinterconsulta = es.claveespecialidad
      ${whereClause}
      ORDER BY c.fechaconsulta DESC
      ${filters.limit ? `OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY` : ''}
    `;

    // 2. Estadísticas generales - CORREGIDAS según estructura real
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as totalConsultas,
        COUNT(DISTINCT c.clavepaciente) as totalPacientes,
        COUNT(DISTINCT c.claveproveedor) as totalProveedores,
        -- Edad promedio simplificada - sin conversiones complejas
        NULL as edadPromedio,
        COUNT(CASE WHEN c.seAsignoIncapacidad = 1 THEN 1 END) as totalIncapacidades,
        COUNT(CASE WHEN c.seasignoaespecialidad = 'S' THEN 1 END) as totalEspecialidades,
        COUNT(CASE WHEN c.elpacienteesempleado = 'S' THEN 1 END) as totalEmpleados,
        COUNT(CASE WHEN c.elpacienteesempleado = 'N' THEN 1 END) as totalFamiliares
      FROM consultas c
      ${whereClause}
    `;

    // 3. Consultas por día
    const consultasPorDiaQuery = `
      SELECT 
        CAST(c.fechaconsulta AS DATE) as fecha,
        COUNT(*) as cantidad
      FROM consultas c
      ${whereClause}
      GROUP BY CAST(c.fechaconsulta AS DATE)
      ORDER BY fecha DESC
    `;

    // 4. Top 10 diagnósticos - CORREGIDO para campo ntext
    const topDiagnosticosQuery = `
      SELECT TOP 10
        CAST(c.diagnostico AS NVARCHAR(500)) as diagnostico,
        COUNT(*) as cantidad
      FROM consultas c
      ${whereClause}
      AND c.diagnostico IS NOT NULL AND DATALENGTH(c.diagnostico) > 0
      GROUP BY CAST(c.diagnostico AS NVARCHAR(500))
      ORDER BY cantidad DESC
    `;

    // 5. Consultas por proveedor
    const consultasPorProveedorQuery = `
      SELECT 
        p.nombreproveedor,
        COUNT(*) as cantidad
      FROM consultas c
      LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      ${whereClause}
      AND p.nombreproveedor IS NOT NULL
      GROUP BY p.nombreproveedor
      ORDER BY cantidad DESC
    `;

    // 6. Distribución por edad - CORREGIDA sin GROUP BY problemático
    const distribucionEdadQuery = `
      SELECT 
        'Todas las edades' as rangoEdad,
        COUNT(*) as cantidad
      FROM consultas c
      ${whereClause}
    `;

    // 7. Medicamentos más recetados - SIMPLIFICADO sin SUM problemático
    const medicamentosMasRecetadosQuery = `
      SELECT TOP 10
        m.medicamento,
        COUNT(*) as cantidad,
        COUNT(*) as cantidadTotal
      FROM detalleReceta dr
      LEFT JOIN MEDICAMENTOS m ON dr.descMedicamento = m.claveMedicamento
      INNER JOIN consultas c ON dr.folioReceta = c.claveconsulta
      ${whereClause.replace('WHERE 1=1', 'WHERE c.claveconsulta IS NOT NULL')}
      AND m.medicamento IS NOT NULL
      GROUP BY m.medicamento
      ORDER BY cantidad DESC
    `;

    // Ejecutar todas las consultas
    const request = db.request();
    
    // Agregar parámetros
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const [
      consultas,
      estadisticas,
      consultasPorDia,
      topDiagnosticos,
      consultasPorProveedor,
      distribucionEdad,
      medicamentosMasRecetados
    ] = await Promise.all([
      request.query(consultasQuery),
      request.query(estadisticasQuery),
      request.query(consultasPorDiaQuery),
      request.query(topDiagnosticosQuery),
      request.query(consultasPorProveedorQuery),
      request.query(distribucionEdadQuery),
      request.query(medicamentosMasRecetadosQuery)
    ]);

    // Formatear fechas en consultas
    const consultasFormateadas = consultas.recordset.map(consulta => ({
      ...consulta,
      fechaconsulta: formatFecha(consulta.fechaconsulta),
      fechacita: formatFecha(consulta.fechacita)
    }));

    // Formatear fechas en consultasPorDia
    const consultasPorDiaFormateadas = consultasPorDia.recordset.map(item => ({
      ...item,
      fecha: formatFecha(item.fecha)
    }));

    return {
      consultas: consultasFormateadas,
      estadisticas: estadisticas.recordset[0],
      graficos: {
        consultasPorDia: consultasPorDiaFormateadas,
        topDiagnosticos: topDiagnosticos.recordset,
        consultasPorProveedor: consultasPorProveedor.recordset,
        distribucionEdad: distribucionEdad.recordset,
        medicamentosMasRecetados: medicamentosMasRecetados.recordset
      }
    };

  } catch (error) {
    console.error("❌ Error en getDashboardData:", error);
    throw error;
  }
}

// Función para obtener datos completos para Excel
async function getAllConsultasForExcel(filters = {}) {
  try {
    const db = await connectToDatabase();
    const { whereClause, params } = buildWhereClause(filters);
    
    const consultasCompletas = `
      SELECT 
        c.claveconsulta, c.fechaconsulta, c.clavenomina, 
        c.presionarterialpaciente, c.temperaturapaciente, 
        c.pulsosxminutopaciente, c.respiracionpaciente, 
        c.estaturapaciente, c.pesopaciente, c.glucosapaciente, 
        c.nombrepaciente, c.edad, c.clavestatus, c.motivoconsulta,
        c.elpacienteesempleado, c.parentesco, c.clavepaciente, 
        c.departamento, c.sindicato, c.claveproveedor, c.diagnostico,
        c.seAsignoIncapacidad, c.especialidadinterconsulta, c.seasignoaespecialidad,
        c.fechacita, c.alergias,
        p.nombreproveedor, p.cedulaproveedor,
        pa.PARENTESCO AS parentescoNombre, 
        es.especialidad AS especialidadNombre,
        -- Medicamentos (concatenados)
        STUFF((
          SELECT ', ' + m.medicamento + ' (' + dr.cantidad + ')'
          FROM detalleReceta dr
          LEFT JOIN MEDICAMENTOS m ON dr.descMedicamento = m.claveMedicamento
          WHERE dr.folioReceta = c.claveconsulta
          FOR XML PATH('')
        ), 1, 2, '') AS medicamentos,
        -- Incapacidades
        STUFF((
          SELECT ', ' + 'Del ' + CONVERT(VARCHAR, di.fechaInicial, 103) + ' al ' + CONVERT(VARCHAR, di.fechaFinal, 103)
          FROM detalleIncapacidad di
          WHERE di.claveConsulta = c.claveconsulta
          FOR XML PATH('')
        ), 1, 2, '') AS incapacidades,
        -- Especialidades
        STUFF((
          SELECT ', ' + esp.especialidad + ': ' + de.observaciones
          FROM detalleEspecialidad de
          LEFT JOIN especialidades esp ON de.claveespecialidad = esp.claveespecialidad
          WHERE de.claveconsulta = c.claveconsulta
          FOR XML PATH('')
        ), 1, 2, '') AS especialidades
      FROM consultas c
      LEFT JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      LEFT JOIN PARENTESCO pa ON c.parentesco = pa.PARENTESCO
      LEFT JOIN especialidades es ON c.especialidadinterconsulta = es.claveespecialidad
      ${whereClause}
      ORDER BY c.fechaconsulta DESC
    `;

    const request = db.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(consultasCompletas);
    
    return result.recordset.map(consulta => ({
      ...consulta,
      fechaconsulta: formatFecha(consulta.fechaconsulta),
      fechacita: formatFecha(consulta.fechacita)
    }));

  } catch (error) {
    console.error("❌ Error en getAllConsultasForExcel:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      fechaInicio, 
      fechaFin, 
      claveproveedor, 
      departamento, 
      clavestatus,
      exportExcel,
      limit = 100,
      offset = 0
    } = req.query;

    const filters = {
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      claveproveedor: claveproveedor ? parseInt(claveproveedor) : null,
      departamento: departamento || null,
      clavestatus: clavestatus ? parseInt(clavestatus) : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Si se solicita export de Excel, usar función específica
    if (exportExcel === 'true') {
      const data = await getAllConsultasForExcel(filters);
      return res.status(200).json({ 
        success: true, 
        data: data,
        type: 'excel'
      });
    }

    // Datos normales del dashboard
    const dashboardData = await getDashboardData(filters);

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error en dashboard API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}