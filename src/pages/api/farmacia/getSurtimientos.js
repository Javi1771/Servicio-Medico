// pages/api/farmacia/getSurtimientos.js
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const date = new Date(fecha);

  //* Verifica si la conversión es válida
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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { barcode } = req.body;
  if (!barcode) {
    return res.status(400).json({ message: "Código de barras requerido" });
  }

  const parts = barcode.trim().split(" ");
  if (parts.length !== 4) {
    return res
      .status(400)
      .json({ message: "Formato de código de barras inválido" });
  }

  const [rawNomina, rawClaveMedico, rawFolioPase, rawFolioSurtimiento] = parts;
  const NOMINA = rawNomina;
  const CLAVEMEDICO = parseInt(rawClaveMedico, 10);
  const FOLIO_PASE = parseInt(rawFolioPase, 10);
  const FOLIO_SURTIMIENTO = parseInt(rawFolioSurtimiento, 10);

  try {
    const db = await connectToDatabase();

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
      FROM SURTIMIENTOS as s
      INNER JOIN PROVEEDORES as p
        ON s.claveusuario = p.claveproveedor
      WHERE s.NOMINA = @NOMINA
        AND s.CLAVEMEDICO = @CLAVEMEDICO
        AND s.FOLIO_PASE = @FOLIO_PASE
        AND s.FOLIO_SURTIMIENTO = @FOLIO_SURTIMIENTO
    `;

    const surtimientoResult = await db
      .request()
      .input("NOMINA", sql.NVarChar(15), NOMINA)
      .input("CLAVEMEDICO", sql.Int, CLAVEMEDICO)
      .input("FOLIO_PASE", sql.Int, FOLIO_PASE)
      .input("FOLIO_SURTIMIENTO", sql.Int, FOLIO_SURTIMIENTO)
      .query(surtimientosQuery);

    let surtimiento = surtimientoResult.recordset[0] || null;

    if (surtimiento) {
      surtimiento.FECHA_EMISION = formatFecha(surtimiento.FECHA_EMISION);
      surtimiento.FECHA_DESPACHO = formatFecha(surtimiento.FECHA_DESPACHO);

      //* Convertir el bit a booleano
      surtimiento.ESTATUS = surtimiento.ESTATUS == 1;

      //* Agregar el mensaje según el valor del estatus
      surtimiento.mensajeEstatus = surtimiento.ESTATUS
        ? "Receta pendiente"
        : "Receta surtida";
    }

    //console.log("Resultado de SURTIMIENTOS:", surtimiento);

    const detalleQuery = `
      SELECT
        ds.idSurtimiento,
        ds.claveMedicamento,
        ds.indicaciones,
        ds.cantidad,
        ds.piezas,
        ds.entregado,             
        m.medicamento AS nombreMedicamento,
        m.piezas AS stock
      FROM detalleSurtimientos ds
      LEFT JOIN medicamentos m
        ON ds.claveMedicamento = m.claveMedicamento
      WHERE ds.folioSurtimiento = @FOLIO_SURTIMIENTO
    `;

    const detalleResult = await db
      .request()
      .input("FOLIO_SURTIMIENTO", sql.Int, FOLIO_SURTIMIENTO)
      .query(detalleQuery);

    const detalleSurtimientos = detalleResult.recordset;

    return res.status(200).json({ surtimiento, detalleSurtimientos });
  } catch (error) {
    console.error("Error en getSurtimientos API:", error);
    return res.status(500).json({ message: error.message });
  }
}
