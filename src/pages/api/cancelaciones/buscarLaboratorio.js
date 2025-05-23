import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  //* Forzar siempre JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    //? 1) Método válido
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ message: "Método no permitido. Usa POST." });
    }

    //? 2) Body válido
    const { folio } = req.body;
    if (!folio) {
      return res
        .status(400)
        .json({ message: "Folio es requerido." });
    }

    const pool = await connectToDatabase();

    //? 3) Verifica que la consulta existe
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
        message:
          "El folio de consulta no es válido o no tiene el estatus requerido.",
      });
    }

    //? 4) Obtener todas las órdenes de laboratorio relacionadas
    const labResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT 
          L.NOMBRE_PACIENTE, L.EDAD, L.DEPARTAMENTO, L.NOMINA,
          L.FOLIO_ORDEN_LABORATORIO, p.nombreproveedor as laboratorio
        FROM LABORATORIOS L
        INNER JOIN proveedores p ON L.CLAVEMEDICO = p.claveproveedor
        WHERE L.CLAVECONSULTA = @folio 
          AND L.ESTATUS = 1
      `);

    if (!labResult.recordset.length) {
      return res.status(404).json({ message: "Orden de laboratorio no encontrada." });
    }

    //? 5) Recopilar estudios por cada laboratorio
    const laboratorios = [];
    for (const row of labResult.recordset) {
      const estudiosResult = await pool
        .request()
        .input("folioOrden", sql.Int, row.FOLIO_ORDEN_LABORATORIO)
        .query(`
          SELECT E.estudio 
          FROM detalleLaboratorio DL
          JOIN ESTUDIOS E ON DL.claveEstudio = E.claveEstudio
          WHERE DL.folio_orden_laboratorio = @folioOrden
        `);

      const estudios = estudiosResult.recordset.map(r => r.estudio);
      laboratorios.push({
        nombre: row.laboratorio,
        estudios,
        folioOrden: row.FOLIO_ORDEN_LABORATORIO,
      });
    }

    //? 6) Devolver datos consolidados
    const { NOMBRE_PACIENTE, EDAD, DEPARTAMENTO, NOMINA } = labResult.recordset[0];
    return res.status(200).json({
      data: {
        NOMBRE_PACIENTE,
        EDAD,
        NOMINA,
        DEPARTAMENTO,
        laboratorios,
      },
    });

  } catch (error) {
    //? 7) Cualquier excepción inesperada retorna JSON de error
    console.error("💥 Error inesperado en buscarLaboratorio:", error);
    return res.status(500).json({
      message: "Error al buscar la orden de laboratorio",
      error:   error.message,
    });
  }
}