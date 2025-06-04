import { connectToDatabase } from '../connectToDatabase';
import soap from 'soap';
import pLimit from 'p-limit';

const WSDL_URL = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';
//* Limitar a 10 tareas concurrentes al procesar cada nómina
const limitConcurrency = pLimit(10);

//** SOAP → GetEmpleadoResult */
async function fetchEmpleadoSOAP(no_nomina) {
  try {
    const client = await soap.createClientAsync(WSDL_URL);
    const [result] = await client.GetEmpleadoAsync({ emp: { num_nom: no_nomina } });
    return result?.GetEmpleadoResult || null;
  } catch (err) {
    console.error(`❌ Error SOAP empleado ${no_nomina}:`, err);
    return null;
  }
}

//** Parsea "DD/MM/YYYY hh:mm:ss a. m." → Date (solo para filtrar bajas) */
function parseFechaBaja(fechaStr) {
  if (!fechaStr) return null;
  const [datePart] = fechaStr.split(' ');
  const [dd, mm, yyyy] = datePart.split('/');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
}

//** Date → "DíaSemana, DD/MM/YYYY, hh:mm a. m." */
function formatFecha(fecha) {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date)) return null;

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaSemana = dias[date.getUTCDay()];
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();

  let hh = date.getUTCHours();
  const min = String(date.getUTCMinutes()).padStart(2, '0');
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
          //? 2.a) Obtener beneficiarios en formato JSON
          const { recordset: ben } = await pool
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
                AND b2.NO_NOMINA = @nomina
              FOR JSON PATH
            `);

          //* Parsear la cadena JSON que devuelve FOR JSON PATH
          let beneficiarios = [];
          if (ben[0]) {
            try {
              beneficiarios = JSON.parse(Object.values(ben[0])[0]);
            } catch {
              beneficiarios = [];
            }
          }

          //? 2.b) Llamar al servicio SOAP para obtener datos del empleado
          const emp = await fetchEmpleadoSOAP(NO_NOMINA);
          if (!emp) return null;

          //! Filtrar empleados dados de baja
          if (emp.fecha_baja) {
            const fb = parseFechaBaja(emp.fecha_baja);
            if (fb < new Date()) {
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
            sinActaCount, //! número de beneficiarios sin acta
          };
        })
      )
    );

    //* Filtrar valores nulos (empleados dados de baja, errores SOAP, etc.)
    const consolidado = raw.filter(item => item !== null);

    res.status(200).json(consolidado);
  } catch (err) {
    console.error('❌ Error /api/beneficiarios/consolidado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
