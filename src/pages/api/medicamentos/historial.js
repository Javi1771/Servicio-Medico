import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  const date = new Date(fecha);

  // Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  // Obtener valores en UTC (evita desfasar la hora)
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Método no permitido" });
  }

  const { clavenomina, clavepaciente } = req.query;

  // 1) Verificar parámetros
  if (!clavenomina || !clavepaciente) {
    return res.status(400).json({
      ok: false,
      error: "Faltan clavenomina y clavepaciente en la query",
    });
  }

  try {
    const pool = await connectToDatabase();

    // 2) Buscar filas en 'consultas' donde (clavenomina AND clavepaciente)
    const queryConsultas = `
      SELECT
        claveconsulta,
        claveproveedor
      FROM [PRESIDENCIA].[dbo].[consultas]
      WHERE clavenomina = @clavenomina
        AND clavepaciente = @clavepaciente
    `;

    const consultasResult = await pool
      .request()
      .input("clavenomina", sql.NVarChar, clavenomina)
      .input("clavepaciente", sql.NVarChar, clavepaciente)
      .query(queryConsultas);

    const filasConsultas = consultasResult.recordset; 
    if (!filasConsultas.length) {
      return res.status(200).json({ ok: true, historial: [] });
    }

    // Mapa para guardar info:  claveconsulta -> claveproveedor
    const consultasMap = {};
    filasConsultas.forEach((row) => {
      consultasMap[row.claveconsulta] = {
        claveproveedor: row.claveproveedor,
      };
    });

    const claveConsultasArray = Object.keys(consultasMap);
    if (!claveConsultasArray.length) {
      return res.status(200).json({ ok: true, historial: [] });
    }

    // 3) Buscar en 'detalleReceta' (descartamos texto "Sin indicaciones...", etc.)
    const queryDetalleReceta = `
      SELECT
        folioReceta,
        indicaciones,
        cantidad,
        descMedicamento
      FROM [PRESIDENCIA].[dbo].[detalleReceta]
      WHERE folioReceta IN (${claveConsultasArray.join(",")})
      ORDER BY idDetalleReceta DESC
    `;

    const detalleRecetaRes = await pool.request().query(queryDetalleReceta);
    const detalleRecetas = detalleRecetaRes.recordset || [];

    // Filtrar las que tengan: 
    // "indicaciones" = "Sin indicaciones ya que no se asignaron medicamentos."
    // "cantidad" = "Sin tiempo de toma estimado, sin medicamentos."
    // "descMedicamento" = 0
    const recetasFiltradas = detalleRecetas.filter((r) => {
      if (
        r.indicaciones === "Sin indicaciones ya que no se asignaron medicamentos." ||
        r.cantidad === "Sin tiempo de toma estimado, sin medicamentos." ||
        r.descMedicamento === 0
      ) {
        return false; // descartar
      }
      return true;
    });

    if (!recetasFiltradas.length) {
      return res.status(200).json({ ok: true, historial: [] });
    }

    // 4) Revisar SURTIMIENTOS => filtrar si FECHA_EMISION > 30 días
    const foliosUnicos = [
      ...new Set(recetasFiltradas.map((r) => r.folioReceta)),
    ];

    let surtiMap = {};
    if (foliosUnicos.length > 0) {
      const querySurt = `
        SELECT
          FOLIO_PASE,
          FECHA_EMISION
        FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
        WHERE FOLIO_PASE IN (${foliosUnicos.join(",")})
      `;
      const surtiRes = await pool.request().query(querySurt);
      const surtimientos = surtiRes.recordset || [];

      // Crear un mapa: folio -> { rawDate, formatted }
      surtimientos.forEach((row) => {
        if (row.FECHA_EMISION) {
          surtiMap[row.FOLIO_PASE] = {
            rawDate: new Date(row.FECHA_EMISION),
            formatted: formatFecha(row.FECHA_EMISION),
          };
        }
      });
    }

    const now = new Date();
    const recetasConFechaValida = recetasFiltradas.filter((r) => {
      const folio = r.folioReceta;
      const surtiInfo = surtiMap[folio];

      // Si no existe en SURTIMIENTOS => descartar
      if (!surtiInfo?.rawDate) {
        return false;
      }
      // Verificar <= 30 días
      const diffMs = now - surtiInfo.rawDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      return diffDays <= 30;
    });

    if (!recetasConFechaValida.length) {
      return res.status(200).json({ ok: true, historial: [] });
    }

    // 5) Para obtener "nombreproveedor", "claveespecialidad" => consultamos tabla 'proveedores'
    //   asumiendo la tabla 'proveedores' TIENE la columna 'claveespecialidad'
    const proveedoresSet = new Set();
    recetasConFechaValida.forEach((r) => {
      const { claveproveedor } = consultasMap[r.folioReceta] || {};
      if (claveproveedor) {
        proveedoresSet.add(claveproveedor);
      }
    });

    let proveedoresMap = {};
    if (proveedoresSet.size > 0) {
      const queryProv = `
        SELECT 
          claveproveedor,
          nombreproveedor,
          claveespecialidad
        FROM [PRESIDENCIA].[dbo].[proveedores]
        WHERE claveproveedor IN (${[...proveedoresSet].join(",")})
      `;
      const provRes = await pool.request().query(queryProv);
      const provRows = provRes.recordset || [];
      provRows.forEach((row) => {
        proveedoresMap[row.claveproveedor] = {
          nombreproveedor: row.nombreproveedor,
          claveespecialidad: row.claveespecialidad,
        };
      });
    }

    // 6) Ahora, con la "claveespecialidad" sacada de "proveedores", iremos a "especialidades"
    const especialidadSet = new Set();
    Object.values(proveedoresMap).forEach((val) => {
      if (val.claveespecialidad) {
        especialidadSet.add(val.claveespecialidad);
      }
    });

    let especialidadesMap = {};
    if (especialidadSet.size > 0) {
      const queryEsp = `
        SELECT
          claveespecialidad,
          especialidad
        FROM [PRESIDENCIA].[dbo].[especialidades]
        WHERE claveespecialidad IN (${[...especialidadSet].join(",")})
      `;
      const espRes = await pool.request().query(queryEsp);
      const espRows = espRes.recordset || [];
      espRows.forEach((row) => {
        especialidadesMap[row.claveespecialidad] = row.especialidad;
      });
    }

    // 7) Construir el historial final
    const historial = recetasConFechaValida.map((r) => {
      const folio = r.folioReceta;
      const surtiInfo = surtiMap[folio];
      const cData = consultasMap[folio] || {}; // { claveproveedor: x }
      const pData = proveedoresMap[cData.claveproveedor] || {}; // { nombreproveedor, claveespecialidad }
      const esp = pData.claveespecialidad
        ? especialidadesMap[pData.claveespecialidad] || "Especialidad desconocida"
        : null;

      return {
        folioReceta: r.folioReceta,
        indicaciones: r.indicaciones,
        tratamiento: r.cantidad,
        descMedicamento: r.descMedicamento,
        fechaEmision: surtiInfo?.formatted || null, // Fecha formateada de SURTIMIENTOS

        nombreproveedor: pData.nombreproveedor || "Proveedor desconocido",
        especialidad: esp || null,
      };
    });

    return res.status(200).json({ ok: true, historial });
  } catch (error) {
    console.error("Error al obtener historial de medicamentos:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener el historial de medicamentos",
    });
  }
}
