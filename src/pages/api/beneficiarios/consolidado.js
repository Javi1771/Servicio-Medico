import { connectToDatabase } from '../connectToDatabase';
import soap from 'soap';
import pLimit from 'p-limit';

const WSDL_URL = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';
const limitConcurrency = pLimit(10);

let soapClientPromise = null;

/*
 * Obtiene (o crea) un cliente SOAP único para reutilizarlo en cada llamada.
 */
async function getSoapClient() {
  if (!soapClientPromise) {
    soapClientPromise = soap.createClientAsync(WSDL_URL);
  }
  return soapClientPromise;
}

/*
 * Llama al servicio SOAP GetEmpleado y retorna el resultado o null en caso de error.
 */
async function fetchEmpleadoSOAP(no_nomina) {
  try {
    const client = await getSoapClient();
    const [resultado] = await client.GetEmpleadoAsync({ emp: { num_nom: no_nomina } });
    return resultado?.GetEmpleadoResult || null;
  } catch (err) {
    console.error(`❌ Error SOAP empleado ${no_nomina}:`, err);
    return null;
  }
}

/*
 * Parsea "DD/MM/YYYY hh:mm:ss a. m." (o similar) a Date, incluyendo la hora.
 * Devuelve null si no se pudo parsear correctamente.
 */
function parseFechaBaja(fechaStr) {
  if (!fechaStr) return null;
  const [fecha, hora, periodo] = fechaStr.split(' ');
  const [dd, mm, yyyy] = fecha.split('/');
  let [hh, min, ss] = hora.split(':');
  hh = parseInt(hh, 10);
  if (periodo.toLowerCase().startsWith('p')) {
    if (hh < 12) hh += 12;
  } else {
    if (hh === 12) hh = 0;
  }
  const iso = `${yyyy}-${mm}-${dd}T${String(hh).padStart(2,'0')}:${min}:${ss}Z`;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
}

/*
 * Formatea una fecha a "DíaSemana, DD/MM/YYYY, hh:mm a.m./p.m."
 * Usa hora local en lugar de UTC.
 */
function formatFecha(fecha) {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date)) return null;

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaSemana = dias[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  let hh = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const periodo = hh >= 12 ? 'p.m.' : 'a.m.';
  hh = hh % 12 || 12;

  return `${diaSemana}, ${dd}/${mm}/${yyyy}, ${hh}:${min} ${periodo}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }

  try {
    const pool = await connectToDatabase();

    //? 1️⃣ Obtener todas las nóminas activas
    const { recordset: nominas } = await pool
      .request()
      .query(`
        SELECT DISTINCT NO_NOMINA
          FROM BENEFICIARIO
         WHERE ACTIVO = 'A'
         ORDER BY NO_NOMINA
      `);

    //? 2️⃣ Procesar cada nómina con concurrencia limitada
    const raw = await Promise.all(
      nominas.map(({ NO_NOMINA }) =>
        limitConcurrency(async () => {
          //? 2.a) Obtener beneficiarios
          const { recordset: rows } = await pool
            .request()
            .input('nomina', NO_NOMINA)
            .query(`
              SELECT
                b2.ID_BENEFICIARIO,
                p2.PARENTESCO AS PARENTESCO_DESCRIPCION,
                b2.NOMBRE, b2.A_PATERNO, b2.A_MATERNO,
                b2.SEXO, b2.ESCOLARIDAD, b2.F_NACIMIENTO,
                b2.ALERGIAS, b2.SANGRE, b2.TEL_EMERGENCIA,
                b2.NOMBRE_EMERGENCIA, b2.ESDISCAPACITADO,
                b2.ESESTUDIANTE, b2.VIGENCIA_ESTUDIOS,
                b2.FOTO_URL, b2.CURP, b2.URL_CONSTANCIA,
                b2.URL_CURP, b2.URL_ACTA_NAC, b2.URL_INE,
                b2.URL_CONCUBINATO, b2.URL_ACTAMATRIMONIO,
                b2.URL_NOISSTE, b2.URL_INCAP, b2.PARENTESCO,
                b2.DESCRIPTOR_FACIAL, b2.FIRMA,
                b2.MOTIVO, b2.URL_ACTADEPENDENCIAECONOMICA
              FROM BENEFICIARIO b2
              INNER JOIN PARENTESCO p2
                     ON b2.PARENTESCO = p2.ID_PARENTESCO
             WHERE b2.ACTIVO = 'A'
               AND b2.NO_NOMINA = @nomina;
            `);

          //* Validación de estructura de beneficiarios
          if (!Array.isArray(rows)) {
            console.warn(`❌ Beneficiarios malformados para nómina ${NO_NOMINA}`, rows);
            return null;
          }
          const beneficiarios = rows;

          //? 2.b) Llamar al servicio SOAP para obtener datos del empleado
          const emp = await fetchEmpleadoSOAP(NO_NOMINA);
          //* Validación de respuesta SOAP
          if (!emp || !emp.num_nom) {
            console.warn(`❌ Empleado inválido o sin num_nom para nómina ${NO_NOMINA}`, emp);
            return null;
          }
          //! Filtrar empleados dados de baja
          if (emp.fecha_baja) {
            const fb = parseFechaBaja(emp.fecha_baja);
            if (fb && fb < new Date()) {
              return null;
            }
          }

          //? 2.c) Formatear fechas de beneficiarios
          const beneficiariosFmt = beneficiarios.map(b => ({
            ...b,
            F_NACIMIENTO_ISO: b.F_NACIMIENTO,
            F_NACIMIENTO: b.F_NACIMIENTO ? formatFecha(b.F_NACIMIENTO) : null,
            VIGENCIA_ESTUDIOS_ISO: b.VIGENCIA_ESTUDIOS,
            VIGENCIA_ESTUDIOS: b.VIGENCIA_ESTUDIOS ? formatFecha(b.VIGENCIA_ESTUDIOS) : null,
          }));

          //? 2.d) Contar cuántos beneficiarios no tienen URL_ACTA_NAC
          const sinActaCount = beneficiariosFmt.filter(b => !b.URL_ACTA_NAC).length;

          return {
            no_nomina: NO_NOMINA,
            empleado: emp,
            beneficiarios: beneficiariosFmt,
            sinActaCount,
          };
        })
      )
    );

    //* Filtrar valores nulos
    const consolidado = raw.filter(item => item !== null);

    //* Dedupe por nómina
    const seen = new Set();
    const uniqueConsolidado = [];
    for (const item of consolidado) {
      if (seen.has(item.no_nomina)) {
        console.warn(`⚠️ Nómina duplicada detectada: ${item.no_nomina}, se omite duplicado.`);
        continue;
      }
      seen.add(item.no_nomina);
      uniqueConsolidado.push(item);
    }

    //* Devolver el listado sin duplicados
    res.status(200).json(uniqueConsolidado);
  } catch (err) {
    console.error('❌ Error /api/beneficiarios/consolidado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
