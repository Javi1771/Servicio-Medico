import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  if (!fecha) return "Fecha no disponible";
  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    console.error("❌ Error: Fecha inválida en formatFecha:", fecha);
    return "Fecha inválida";
  }
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
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

export default async function handler(req, res) {
  console.log("🔔 Handler getSurtimientos iniciado");

  if (req.method !== "POST") {
    console.error("🚫 Método no permitido:", req.method);
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { barcode } = req.body;
  console.log("📦 Received barcode:", barcode);

  if (!barcode) {
    console.error("❌ Código de barras ausente");
    return res.status(400).json({ message: "Código de barras requerido" });
  }

  const parts = barcode.trim().split(" ");
  console.log("🔍 Barcode partes:", parts);

  if (parts.length !== 4) {
    console.error(
      `❌ Formato inválido, se esperaban 4 partes pero vienen ${parts.length}`,
      parts
    );
    return res
      .status(400)
      .json({ message: "Formato de código de barras inválido" });
  }

  const [rawNomina, rawClaveMedico, rawFolioPase, rawFolioSurtimiento] = parts;
  console.log("🌟 rawNomina:", rawNomina);
  console.log("🌟 rawClaveMedico:", rawClaveMedico);
  console.log("🌟 rawFolioPase:", rawFolioPase);
  console.log("🌟 rawFolioSurtimiento:", rawFolioSurtimiento);

  const NOMINA = rawNomina;
  const CLAVEMEDICO = parseInt(rawClaveMedico, 10);
  const FOLIO_PASE = parseInt(rawFolioPase, 10);
  const FOLIO_SURTIMIENTO = parseInt(rawFolioSurtimiento, 10);

  if (isNaN(CLAVEMEDICO) || isNaN(FOLIO_PASE) || isNaN(FOLIO_SURTIMIENTO)) {
    console.error(
      "❌ Uno o más datos numéricos del código de barras son inválidos:",
      { rawClaveMedico, rawFolioPase, rawFolioSurtimiento }
    );
    return res.status(400).json({
      message: "Uno o más datos numéricos del código de barras son inválidos",
    });
  }

  try {
    const db = await connectToDatabase();

    //* Consulta principal con LEFT JOIN y condiciones de receta en el ON
    const surtimientosQuery = `
      SELECT 
        s.[FOLIO_SURTIMIENTO],
        s.[FOLIO_PASE],
        s.[FECHA_EMISION],
        s.[NOMINA],
        s.[CLAVE_PACIENTE],
        s.[NOMBRE_PACIENTE],
        s.[EDAD],
        s.[ESEMPLEADO],
        s.[CLAVEMEDICO],
        s.[DIAGNOSTICO],
        s.[DEPARTAMENTO],
        s.[ESTATUS],
        s.[COSTO],
        s.[FECHA_DESPACHO],
        s.[SINDICATO],
        s.[claveusuario],
        p.nombreproveedor
      FROM SURTIMIENTOS AS s
        LEFT JOIN PROVEEDORES AS p
          ON s.claveusuario = p.claveproveedor
        LEFT JOIN detalleReceta AS dr
          ON dr.folioReceta = s.FOLIO_PASE
             AND dr.seAsignoResurtimiento = 1
             AND dr.surtimientoActual    < dr.cantidadMeses
      WHERE s.NOMINA            = @NOMINA
        AND s.CLAVEMEDICO       = @CLAVEMEDICO
        AND s.FOLIO_PASE        = @FOLIO_PASE
        AND s.FOLIO_SURTIMIENTO = @FOLIO_SURTIMIENTO
    `;

    const surtimientoResult = await db
      .request()
      .input("NOMINA", sql.NVarChar(15), NOMINA)
      .input("CLAVEMEDICO", sql.Int, CLAVEMEDICO)
      .input("FOLIO_PASE", sql.Int, FOLIO_PASE)
      .input("FOLIO_SURTIMIENTO", sql.Int, FOLIO_SURTIMIENTO)
      .query(surtimientosQuery);

    console.log(
      "📊 Consulta principal recordset:",
      surtimientoResult.recordset.length,
      surtimientoResult.recordset
    );

    if (!surtimientoResult.recordset.length) {
      console.warn(
        "⚠️ Consulta principal no devolvió datos a pesar de pasar validaciones"
      );
      return res
        .status(404)
        .json({ message: "No se encontró ningún surtimiento con esos datos" });
    }

    const surtimiento = surtimientoResult.recordset[0];
    surtimiento.FECHA_EMISION = formatFecha(surtimiento.FECHA_EMISION);
    surtimiento.FECHA_DESPACHO = formatFecha(surtimiento.FECHA_DESPACHO);
    surtimiento.ESTATUS =
      typeof surtimiento.ESTATUS === "boolean"
        ? surtimiento.ESTATUS
        : surtimiento.ESTATUS == 1;
    surtimiento.mensajeEstatus = surtimiento.ESTATUS
      ? "Receta pendiente"
      : "Receta surtida";

    //* Consulta de detalles
    const detalleQuery = `
      SELECT
        ds.idSurtimiento,
        ds.claveMedicamento,
        ds.indicaciones,
        ds.cantidad,
        ds.piezas,
        ds.entregado,             
        m.medicamento AS nombreMedicamento,
        m.piezas     AS stock
      FROM detalleSurtimientos ds
      LEFT JOIN medicamentos m
        ON ds.claveMedicamento = m.claveMedicamento
      WHERE ds.folioSurtimiento = @FOLIO_SURTIMIENTO
    `;

    const detalleResult = await db
      .request()
      .input("FOLIO_SURTIMIENTO", sql.Int, FOLIO_SURTIMIENTO)
      .query(detalleQuery);

    console.log(
      "📊 Detalle surtimientos recordset:",
      detalleResult.recordset.length,
      detalleResult.recordset
    );

    const detalleSurtimientos = detalleResult.recordset;

    return res.status(200).json({ surtimiento, detalleSurtimientos });
  } catch (error) {
    console.error("🔥 Error en getSurtimientos API:", error);
    return res.status(500).json({ message: error.message });
  }
}
