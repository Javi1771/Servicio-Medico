import sql from 'mssql';
import { connectToDatabase } from '../connectToDatabase';
import soap from 'soap';
import pMap from 'p-map';

const SOAP_WSDL_URL = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';

// Singleton para el cliente SOAP con reconexión
let soapClient = null;
const getSoapClient = async () => {
  if (!soapClient) {
    try {
      soapClient = await soap.createClientAsync(SOAP_WSDL_URL);
      soapClient.on('soapError', (err) => {
        console.error('SOAP Client Error:', err);
        soapClient = null; // Forzar recreación en próxima llamada
      });
    } catch (err) {
      console.error('SOAP Client Creation Failed:', err);
      throw new Error('Error creating SOAP client');
    }
  }
  return soapClient;
};

// Cache LRU para resultados SOAP
const soapCache = new Map();
const CACHE_MAX_SIZE = 500;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

// Limpiar caché periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of soapCache) {
    if (now - timestamp > CACHE_EXPIRATION) {
      soapCache.delete(key);
    }
  }
}, 60 * 1000); // Cada minuto

function parseDateWithAmPm(str) {
  if (!str) return null;
  
  try {
    // Optimizado para manejar múltiples formatos
    const datePart = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!datePart) return null;
    const [, dd, mm, yyyy] = datePart;

    let hh = '00', mi = '00', ss = '00';
    const timePart = str.match(/(\d{1,2}):(\d{2}):?(\d{2})?\s*([ap]\.?\s*m\.?)?/i);
    
    if (timePart) {
      hh = timePart[1].padStart(2, '0');
      mi = timePart[2].padStart(2, '0');
      ss = timePart[3]?.padStart(2, '0') || '00';
      
      if (timePart[4]) {
        const ampm = timePart[4].toLowerCase().replace(/\s|\./g, '');
        if (ampm.includes('pm') && hh < 12) hh = String(parseInt(hh) + 12).padStart(2, '0');
        if (ampm.includes('am') && hh === '12') hh = '00';
      }
    }

    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`).toISOString();
  } catch (error) {
    console.error('Error parsing date:', str, error);
    return null;
  }
}

function normalizeEmpleado(emp) {
  try {
    const nombres = [emp.nombre, emp.a_paterno, emp.a_materno]
      .filter(Boolean)
      .map(s => s.trim())
      .join(' ');

    return {
      num_nom: emp.num_nom?.trim() || null,
      fullName: nombres || null,
      puesto: emp.puesto?.trim() || null,
      fecha_alta: parseDateWithAmPm(emp.fecha_alta),
      fecha_baja: parseDateWithAmPm(emp.fecha_baja),
      fecha_nacimiento: parseDateWithAmPm(emp.fecha_nacimiento),
      departamento_soap: emp.departamento?.trim() || null,
      municipio: emp.municipio?.trim() || null,
      estado: emp.estado?.trim() || null,
      curp: emp.curp?.trim() || null,
      rfc: emp.rfc?.trim() || null,
      tipo_sangre: emp.tipo_sangre?.trim() || null,
      sexo: emp.sexo?.trim() || null,
      correo: emp.correo?.trim() || null,
      telefono: emp.telefono?.trim() || null
    };
  } catch (error) {
    console.error('Error normalizing employee:', emp, error);
    return {
      num_nom: emp.num_nom?.trim() || null,
      fullName: null,
      puesto: null,
      error: 'Error normalizing employee data'
    };
  }
}

async function validarEmpleado(numNom) {
  const cacheKey = numNom.trim();
  
  // Verificar caché
  const cached = soapCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRATION)) {
    return cached.data;
  }

  try {
    const client = await getSoapClient();
    const [result] = await client.GetEmpleadoAsync({ emp: { num_nom: cacheKey } });
    
    if (!result?.GetEmpleadoResult) {
      throw new Error('Empleado no encontrado');
    }

    const emp = normalizeEmpleado(result.GetEmpleadoResult);

    // Validar fecha de baja
    if (emp.fecha_baja) {
      const fechaBaja = new Date(emp.fecha_baja);
      if (fechaBaja < new Date() && emp.puesto?.trim() !== 'PENSIONADO') {
        throw new Error('Empleado dado de baja');
      }
    }

    // Actualizar caché
    const cacheEntry = { data: emp, timestamp: Date.now() };
    soapCache.set(cacheKey, cacheEntry);
    
    // Limitar tamaño de caché
    if (soapCache.size > CACHE_MAX_SIZE) {
      const oldestKey = [...soapCache.keys()][0];
      soapCache.delete(oldestKey);
    }

    return emp;
  } catch (error) {
    console.error(`Error validando empleado ${cacheKey}:`, error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  // Validación y parseo de parámetros
  const { startDate, endDate, page = 1, pageSize = 100 } = req.query;
  const parsedPage = parseInt(page, 10);
  const parsedPageSize = parseInt(pageSize, 10);
  
  if (isNaN(parsedPage)) return res.status(400).json({ error: 'Parámetro page inválido' });
  if (isNaN(parsedPageSize)) return res.status(400).json({ error: 'Parámetro pageSize inválido' });
  
  let startDateObj, endDateObj;
  try {
    if (startDate) startDateObj = new Date(startDate);
    if (endDate) endDateObj = new Date(endDate);
    
    if (startDate && isNaN(startDateObj)) throw new Error('startDate inválido');
    if (endDate && isNaN(endDateObj)) throw new Error('endDate inválido');
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const pool = await connectToDatabase();
    const offset = (parsedPage - 1) * parsedPageSize;

    // Construcción de consulta SQL segura
    let whereClauses = ['inc.estatus = 1'];
    const params = {};
    
    if (startDate) {
      whereClauses.push('inc.fecha >= @startDate');
      params.startDate = new Date(startDate);
    }
    
    if (endDate) {
      whereClauses.push('inc.fecha <= @endDate');
      params.endDate = new Date(endDate);
    }
    
    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT
        inc.claveincapacidad,
        inc.folioincapacidad,
        inc.fecha,
        inc.fechainicio,
        inc.fechafin,
        LTRIM(RTRIM(inc.nomina)) AS nomina,
        inc.nombrepaciente,
        inc.departamento,
        inc.observaciones,
        inc.edad,
        inc.quiencapturo,
        inc.claveconsulta,
        inc.claveMedico,
        inc.estatus,
        inc.cancelo,
        prov.nombreproveedor AS nombreproveedor,
        COUNT(*) OVER() AS total_count
      FROM incapacidades AS inc
      LEFT JOIN proveedores AS prov
        ON inc.claveMedico = prov.claveproveedor
      ${whereSQL}
      ORDER BY inc.fecha DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parsedPageSize} ROWS ONLY;
    `;

    const request = pool.request();
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, sql.DateTime, value);
    });

    const { recordset } = await request.query(query);
    
    if (!recordset || recordset.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          currentPage: parsedPage,
          pageSize: parsedPageSize,
          totalItems: 0,
          totalPages: 0
        }
      });
    }

    const totalItems = recordset[0].total_count || 0;
    const totalPages = Math.ceil(totalItems / parsedPageSize);

    // Mapeo de resultados sin los metadatos de paginación
    const filas = recordset.map(r => {
      const { ...rest } = r;
      return {
        ...rest,
        nomina: String(rest.nomina).trim(),
      };
    });

    // Enriquecimiento con datos SOAP en paralelo con control de concurrencia
    const CONCURRENCY_LIMIT = 10;
    const enrichedData = await pMap(
      filas,
      async fila => {
        try {
          const empleado = fila.nomina 
            ? await validarEmpleado(fila.nomina)
            : null;
          
          return {
            ...fila,
            empleado,
            status: 'success'
          };
        } catch (error) {
          console.warn(`⚠️ Omitido SOAP para nómina ${fila.nomina}: ${error.message}`);
          return {
            ...fila,
            empleado: null,
            status: 'soap_error',
            error: error.message
          };
        }
      },
      { concurrency: CONCURRENCY_LIMIT }
    );

    // Respuesta estructurada con paginación
    return res.status(200).json({
      data: enrichedData,
      pagination: {
        currentPage: parsedPage,
        pageSize: parsedPageSize,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('❌ Error en infoIncapacidades:', error);
    return res.status(500).json({ 
      error: 'Error en el servidor',
      details: error.message 
    });
  }
}