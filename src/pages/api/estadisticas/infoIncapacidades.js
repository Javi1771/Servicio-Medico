import sql from 'mssql';
import { connectToDatabase } from '../connectToDatabase';
import soap from 'soap';

const SOAP_WSDL_URL = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';

// Cacheamos el cliente SOAP para no recrearlo en cada llamada
let soapClientPromise = null;
const getSoapClient = () => {
  if (!soapClientPromise) {
    soapClientPromise = soap.createClientAsync(SOAP_WSDL_URL);
  }
  return soapClientPromise;
};

async function validarEmpleado(rawNom) {
  const num_nom = String(rawNom).trim();
  const client = await getSoapClient();
  const [result] = await client.GetEmpleadoAsync({ emp: { num_nom } });
  if (!result?.GetEmpleadoResult) {
    throw new Error('Empleado no encontrado');
  }
  const emp = result.GetEmpleadoResult;

  // Normalizar fecha de baja “DD/MM/YYYY” → “YYYY-MM-DDT00:00:00Z”
  if (emp.fecha_baja) {
    const bajaStr = emp.fecha_baja.replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, '$3-$2-$1');
    const fechaBaja = new Date(bajaStr);
    if (fechaBaja < new Date() && emp.puesto !== 'PENSIONADO') {
      throw new Error('Empleado dado de baja');
    }
  }
  return emp;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  const { startDate, endDate } = req.query;
  let where = 'WHERE estatus = 1';
  if (startDate) where += ` AND fechainicio >= @startDate`;
  if (endDate)   where += ` AND fechafin   <= @endDate`;

  try {
    const pool  = await connectToDatabase();
    const dbReq = pool.request();
    if (startDate) dbReq.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate)   dbReq.input('endDate',   sql.DateTime, new Date(endDate));

    const { recordset: rows } = await dbReq.query(`
      SELECT nomina, nombrepaciente, departamento, fechainicio, fechafin
      FROM incapacidades
      ${where}
    `);

    // Agrupamos en JS por nomina
    const stats = {};
    for (const r of rows) {
      const nom = String(r.nomina).trim();
      const dias = Math.round(
        (new Date(r.fechafin) - new Date(r.fechainicio)) / (1000 * 60 * 60 * 24)
      );
      if (!stats[nom]) {
        stats[nom] = {
          nomina: nom,
          nombrepaciente: String(r.nombrepaciente).trim(),
          departamento:   String(r.departamento).trim(),
          numero_incapacidades: 0,
          dias_totales_incapacidad: 0
        };
      }
      stats[nom].numero_incapacidades++;
      stats[nom].dias_totales_incapacidad += dias;
    }

    // Validar empleados en paralelo
    const grupos = Object.keys(stats);
    const promesas = grupos.map(async (nom) => {
      try {
        const emp = await validarEmpleado(nom);

        // Construir fullName dinámico
        const first = emp.nombre ?? '';
        const pater = emp.a_paterno ?? '';
        const mater = emp.a_materno ?? '';
        const fullName = [first, pater, mater].filter(Boolean).join(' ').trim();

        const g = stats[nom];
        const prom = g.numero_incapacidades > 0
          ? +(g.dias_totales_incapacidad / g.numero_incapacidades).toFixed(2)
          : 0;

        return {
          nomina:                   nom,
          nombrepaciente:           g.nombrepaciente,
          departamento:             g.departamento,
          numero_incapacidades:     g.numero_incapacidades,
          dias_totales_incapacidad: g.dias_totales_incapacidad,
          duracion_promedio:        prom,
          empleado: {
            num_nom:    nom,
            fullName,     
            puesto:     emp.puesto,
            fecha_alta: emp.fecha_alta
          }
        };
      } catch (err) {
        console.warn(`⚠️ Omitido ${nom}: ${err.message}`);
        return null;
      }
    });

    const rawResultado = await Promise.all(promesas);
    const resultado = rawResultado.filter(Boolean)
      .sort((a, b) => b.numero_incapacidades - a.numero_incapacidades);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('❌ Error en infoIncapacidades:', error);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}
