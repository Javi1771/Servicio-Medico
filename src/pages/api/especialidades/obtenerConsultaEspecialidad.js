import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  const { folio } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const folioInt = parseInt(folio, 10);
  if (isNaN(folioInt)) {
    return res
      .status(400)
      .json({ error: "El parámetro 'folio' debe ser un número válido" });
  }

  try {
    const pool = await connectToDatabase();

    //? 1. Obtener datos de "consultas"
    const consultaQuery = `
      SELECT claveconsulta, nombrepaciente, edad, parentesco,
             sindicato, clavenomina, clavepaciente,
             elpacienteesempleado, departamento
      FROM consultas
      WHERE claveconsulta = @folio
    `;
    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, folioInt)
      .query(consultaQuery);

    if (consultaResult.recordset.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }
    const consulta = consultaResult.recordset[0];

    //? 2. Determinar nombre de parentesco
    let parentescoNombre = "EMPLEADO";
    if (consulta.parentesco === 0 || consulta.parentesco === "Empleado") {
      parentescoNombre = "EMPLEADO";
    } else if (!isNaN(consulta.parentesco)) {
      const parentescoQuery = `
        SELECT PARENTESCO FROM PARENTESCO WHERE ID_PARENTESCO = @parentescoId
      `;
      const parentescoResult = await pool
        .request()
        .input("parentescoId", sql.Int, consulta.parentesco)
        .query(parentescoQuery);
      if (parentescoResult.recordset.length > 0) {
        parentescoNombre = parentescoResult.recordset[0].PARENTESCO;
      }
    }

    //? 3. Obtener especialidad
    const especialidadQuery = `
      SELECT e.especialidad, e.claveespecialidad
      FROM detalleEspecialidad d
      JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
      WHERE d.claveconsulta = @folio
    `;
    const especialidadResult = await pool
      .request()
      .input("folio", sql.Int, folioInt)
      .query(especialidadQuery);

    if (especialidadResult.recordset.length === 0) {
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }
    const especialidad = especialidadResult.recordset[0];

    //? 4. Obtener especialistas, incluyendo siempre al proveedor 610
    const especialistasQuery = `
      SELECT claveproveedor, nombreproveedor, costo
      FROM proveedores
      WHERE activo = 'S'
        AND (
          claveespecialidad = @claveEspecialidad
          OR claveproveedor = 610
        )
      ORDER BY nombreproveedor ASC
    `;
    const especialistasResult = await pool
      .request()
      .input("claveEspecialidad", sql.Int, especialidad.claveespecialidad)
      .query(especialistasQuery);

    res.status(200).json({
      paciente: consulta,
      parentesco: parentescoNombre,
      especialidad: especialidad,
      especialistas: especialistasResult.recordset,
    });
  } catch (error) {
    console.error("❌ Error en obtenerConsultaEspecialidad:", error.message);
    res
      .status(500)
      .json({ error: "Error al obtener datos", details: error.message });
  }
}
