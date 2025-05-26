import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  //* Forzar siempre JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //? 1️⃣ Sólo POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido. Usa POST." });
  }

  //? 2️⃣ Parsear body
  let body;
  try {
    body = req.body;
  } catch {
    return res
      .status(400)
      .json({ success: false, message: "Body JSON inválido." });
  }

  const { folio } = body;
  if (!folio) {
    return res
      .status(400)
      .json({ success: false, message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    //? 3️⃣ Verificar existencia de la consulta
    const consultaResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT claveconsulta 
        FROM consultas 
        WHERE claveconsulta = @folio AND clavestatus = 2
      `);

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        success: false,
        message:
          "El folio de consulta no es válido o no tiene el estatus requerido.",
      });
    }

    //? 4️⃣ Obtener órdenes de laboratorio
    const labResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT 
          L.NOMBRE_PACIENTE, L.EDAD, L.DEPARTAMENTO, L.NOMINA,
          L.FOLIO_ORDEN_LABORATORIO, p.nombreproveedor AS laboratorio
        FROM LABORATORIOS L
        INNER JOIN proveedores p
          ON L.CLAVEMEDICO = p.claveproveedor
        WHERE L.CLAVECONSULTA = @folio 
          AND L.ESTATUS = 1
      `);

    if (!labResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Orden de laboratorio no encontrada." });
    }

    //? 5️⃣ Recopilar estudios para cada orden
    const laboratorios = [];
    for (const row of labResult.recordset) {
      const estudiosResult = await pool
        .request()
        .input("folioOrden", sql.Int, row.FOLIO_ORDEN_LABORATORIO)
        .query(`
          SELECT E.estudio
          FROM detalleLaboratorio DL
          JOIN ESTUDIOS E
            ON DL.claveEstudio = E.claveEstudio
          WHERE DL.folio_orden_laboratorio = @folioOrden
        `);

      laboratorios.push({
        nombre: row.laboratorio,
        folioOrden: row.FOLIO_ORDEN_LABORATORIO,
        estudios: estudiosResult.recordset.map((r) => r.estudio),
      });
    }

    //? 6️⃣ Responder con datos consolidados
    const { NOMBRE_PACIENTE, EDAD, DEPARTAMENTO, NOMINA } =
      labResult.recordset[0];
    return res.status(200).json({
      success: true,
      data: {
        NOMBRE_PACIENTE,
        EDAD,
        NOMINA,
        DEPARTAMENTO,
        laboratorios,
      },
    });
  } catch (error) {
    console.error("💥 Error inesperado en buscarLaboratorio:", error);
    return res.status(500).json({
      success: false,
      message: "Error al buscar la orden de laboratorio",
      error: error.message,
    });
  }
}
