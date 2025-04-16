import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioConsulta } = req.body;

  if (!folioConsulta) {
    return res.status(400).json({ message: "El folio de consulta es requerido." });
  }

  try {
    const pool = await connectToDatabase();
    //console.log("Conectado a la base de datos. Realizando consultas...");

    // Consulta 1: Obtener claveproveedor, especialidadinterconsulta y diagnostico
    const consultaBase = await pool
      .request()
      .input("folioConsulta", sql.Int, folioConsulta)
      .query(`
        SELECT claveproveedor, especialidadinterconsulta, diagnostico
        FROM consultas
        WHERE claveconsulta = @folioConsulta
      `);

    if (consultaBase.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró información para el folio proporcionado." });
    }

    const { claveproveedor, diagnostico } = consultaBase.recordset[0];

    // Consulta 2: Obtener el nombre del proveedor y su claveespecialidad
    const proveedorResult = await pool
      .request()
      .input("claveproveedor", sql.Int, claveproveedor)
      .query(`
        SELECT nombreproveedor, claveespecialidad
        FROM proveedores
        WHERE claveproveedor = @claveproveedor
      `);

    const nombreProveedor = proveedorResult.recordset.length > 0 ? proveedorResult.recordset[0].nombreproveedor : "No disponible";
    const claveespecialidad = proveedorResult.recordset.length > 0 ? proveedorResult.recordset[0].claveespecialidad : null;

    // Consulta 3: Obtener el nombre de la especialidad usando claveespecialidad
    let especialidadNombre = "No registrada";
    if (claveespecialidad) {
      const especialidadResult = await pool
        .request()
        .input("claveespecialidad", sql.Int, claveespecialidad)
        .query(`
          SELECT especialidad
          FROM especialidades
          WHERE claveespecialidad = @claveespecialidad
        `);

      if (especialidadResult.recordset.length > 0) {
        especialidadNombre = especialidadResult.recordset[0].especialidad;
      }
    }

    // Respuesta consolidada
    return res.status(200).json({
      nombreProveedor,
      especialidadNombre,
      diagnostico,
    });
  } catch (error) {
    console.error("Error en la API getEspecialista:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}