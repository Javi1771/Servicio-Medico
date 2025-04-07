import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    //* Validar que el folio exista en la tabla CONSULTAS y clavestatus = 2
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

    //* Buscar en la tabla LABORATORIOS por CLAVECONSULTA
    const labResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT 
          NOMBRE_PACIENTE, EDAD, DEPARTAMENTO, FOLIO_ORDEN_LABORATORIO 
        FROM LABORATORIOS 
        WHERE CLAVECONSULTA = @folio 
          AND ESTATUS = 1
      `);

    if (!labResult.recordset.length) {
      return res.status(404).json({ message: "Orden de laboratorio no encontrada." });
    }

    const lab = labResult.recordset[0];
    //* Suponiendo que FOLIO_ORDEN_LABORATORIO es numérico, se usa como tal.
    const folioOrden = lab.FOLIO_ORDEN_LABORATORIO;

    //* Buscar en detalleLaboratorio todos los estudios asociados usando FOLIO_ORDEN_LABORATORIO
    const estudiosResult = await pool
      .request()
      .input("folioOrden", sql.Int, folioOrden)
      .query(`
        SELECT E.estudio 
        FROM detalleLaboratorio DL
        JOIN ESTUDIOS E ON DL.claveEstudio = E.claveEstudio
        WHERE DL.folio_orden_laboratorio = @folioOrden
      `);

    //* Se arma un array con todos los nombres de estudios (puede estar vacío si no hay coincidencias)
    const estudios = estudiosResult.recordset.map(row => row.estudio);

    //* Mostrar en log los estudios recibidos
    console.log("Estudios recibidos:", estudios);

    return res.status(200).json({
      data: {
        NOMBRE_PACIENTE: lab.NOMBRE_PACIENTE,
        EDAD: lab.EDAD,
        DEPARTAMENTO: lab.DEPARTAMENTO,
        FOLIO_ORDEN_LABORATORIO: folioOrden,
        estudios,
      },
    });
  } catch (error) {
    console.error("Error al buscar orden de laboratorio:", error);
    return res.status(500).json({
      message: "Error al buscar la orden de laboratorio",
      error: error.message,
    });
  }
}
