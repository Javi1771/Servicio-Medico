import { connectToDatabase } from "../connectToDatabase";
import soap from "soap";
import pLimit from "p-limit";

const WSDL_URL = "http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl";
const limitConcurrency = pLimit(10);

let soapClientPromise = null;

//* CLIENTE SOAP SÓLO UNA VEZ */
async function getSoapClient() {
  if (!soapClientPromise) {
    soapClientPromise = soap.createClientAsync(WSDL_URL);
  }
  return soapClientPromise;
}
async function fetchEmpleadoSOAP(no_nomina) {
  try {
    const client = await getSoapClient();
    const [resultado] = await client.GetEmpleadoAsync({
      emp: { num_nom: no_nomina },
    });
    return resultado?.GetEmpleadoResult || null;
  } catch (err) {
    console.error(`❌ Error SOAP empleado ${no_nomina}:`, err);
    return null;
  }
}

//* PARSEO DE FECHAS */
function parseFecha(fechaInput) {
  if (!fechaInput) return null;
  if (fechaInput instanceof Date)
    return isNaN(fechaInput.getTime()) ? null : fechaInput;
  if (typeof fechaInput === "number") {
    const d = new Date(fechaInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof fechaInput !== "string") return null;

  //* ISO
  const intentoISO = new Date(fechaInput);
  if (!isNaN(intentoISO.getTime())) return intentoISO;

  //* DD/MM/YYYY hh:mm:ss a.m./p.m.
  const parts = fechaInput.split(" ");
  if (parts.length < 3) return null;
  const [fPart, hPart, pPart] = parts;
  const [dd, mm, yyyy] = fPart.split("/");
  let [hh, mi, ss] = hPart.split(":").map((n) => parseInt(n, 10));
  if (pPart.toLowerCase().includes("p") && hh < 12) hh += 12;
  if (pPart.toLowerCase().includes("a") && hh === 12) hh = 0;

  const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${String(
    hh
  ).padStart(2, "0")}:${mi}:${ss}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

//* FORMATO LOCAL */
function formatFechaLocal(fechaInput) {
  const date = fechaInput instanceof Date ? fechaInput : new Date(fechaInput);
  if (isNaN(date.getTime())) return null;
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const diaSemana = dias[date.getDay()];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  let hh = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const periodo = hh >= 12 ? "p.m." : "a.m.";
  hh = hh % 12 || 12;
  return `${diaSemana}, ${dd}/${mm}/${yyyy}, ${hh}:${min} ${periodo}`;
}

//* HANDLER */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }

  try {
    const pool = await connectToDatabase();

    //? 1️⃣ Traer todas las incapacidades + proveedor
    const { recordset: allIncap } = await pool.request().query(`
      SELECT
        i.fecha,
        i.fechainicio,
        i.fechafin,
        i.nomina,
        i.departamento,
        i.observaciones,
        i.edad,
        i.claveMedico,
        p.nombreproveedor AS nombreProveedor
      FROM PRUEBAS.dbo.incapacidades i
      LEFT JOIN PRUEBAS.dbo.proveedores p
        ON i.claveMedico = p.claveproveedor
      WHERE i.estatus = 1
      ORDER BY i.fecha DESC
    `);

    //? 2️⃣ Agrupar por nómina
    const grupos = allIncap.reduce((acc, inc) => {
      (acc[inc.nomina] ||= []).push(inc);
      return acc;
    }, {});

    //? 3️⃣ Procesar cada nómina UNA vez
    const resultados = await Promise.all(
      Object.entries(grupos).map(([nomina, registros]) =>
        limitConcurrency(async () => {
          const emp = await fetchEmpleadoSOAP(nomina);
          if (!emp) return null;
          //! Filtrar bajas
          if (emp.fecha_baja) {
            const fb = parseFecha(emp.fecha_baja);
            if (fb && fb < new Date()) return null;
          }

          //* Mapear cada registro usando la misma respuesta SOAP
          return registros.map((inc) => {
            const fecha = parseFecha(inc.fecha);
            const inicio = parseFecha(inc.fechainicio);
            const fin = parseFecha(inc.fechafin);

            return {
              fecha: fecha ? formatFechaLocal(fecha) : null,
              fechainicio: inicio ? formatFechaLocal(inicio) : null,
              fechafin: fin ? formatFechaLocal(fin) : null,
              nomina: inc.nomina,
              empleado: {
                nombre: emp.nombre,
                a_paterno: emp.a_paterno,
                a_materno: emp.a_materno,
                puesto: emp.puesto,
                grupoNomina: emp.grupoNomina,
                cuotaSindical: emp.cuotaSindical,
                fecha_nacimiento: emp.fecha_nacimiento
                  ? formatFechaLocal(parseFecha(emp.fecha_nacimiento))
                  : null,
                fecha_alta: emp.fecha_alta
                  ? formatFechaLocal(parseFecha(emp.fecha_alta))
                  : null,
                fecha_baja: emp.fecha_baja
                  ? formatFechaLocal(parseFecha(emp.fecha_baja))
                  : null,
              },
              departamentoIncap: inc.departamento,
              observaciones: inc.observaciones,
              edad: inc.edad,
              nombreProveedor: inc.nombreProveedor || null,
            };
          });
        })
      )
    );

    //? 4️⃣ Aplanar y filtrar nulls
    const consolidado = resultados.filter((group) => group).flat();

    res.status(200).json(consolidado);
  } catch (err) {
    console.error("❌ Error /api/incapacidades/consolidado:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}
