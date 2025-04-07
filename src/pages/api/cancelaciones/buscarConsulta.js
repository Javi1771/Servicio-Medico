import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio, tipo } = req.body; //* tipo: se espera "paseEspecialidad"
  if (!folio || !tipo) {
    return res.status(400).json({ message: "Folio y tipo son requeridos." });
  }

  //* Si por alguna razón se recibe el tipo "consultaGeneral", se rechaza
  if (tipo === "consultaGeneral") {
    return res.status(400).json({
      message: "El tipo 'consultaGeneral' no es permitido. Use 'paseEspecialidad'."
    });
  }

  try {
    const pool = await connectToDatabase();

    //* Consulta base para pase a especialidad (se asume que la consulta debe tener diagnósticos, motivación, asignación y cita)
    let consultaQuery = `
      SELECT nombrepaciente, edad, departamento, claveproveedor, especialidadinterconsulta
      FROM consultas
      WHERE claveconsulta = @folio
        AND clavestatus = 2
        AND diagnostico IS NULL
        AND motivoconsulta IS NULL
        AND seasignoaespecialidad IS NOT NULL
    `;
    //* Condición adicional para pase a especialidad: la especialidad y la cita deben existir
    if (tipo === "paseEspecialidad") {
      consultaQuery += " AND especialidadinterconsulta IS NOT NULL AND fechacita IS NOT NULL";
    }

    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, parseInt(folio, 10))
      .query(consultaQuery);

    if (!consultaResult.recordset.length) {
      return res.status(404).json({
        message: "Consulta no encontrada o los datos no coinciden con un pase a especialidad."
      });
    }

    const consulta = consultaResult.recordset[0];

    //* Buscar nombre del proveedor en la tabla "proveedores"
    const proveedorResult = await pool
      .request()
      .input("claveproveedor", sql.Int, consulta.claveproveedor)
      .query(`SELECT nombreproveedor FROM proveedores WHERE claveproveedor = @claveproveedor`);

    let nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    //* Buscar el nombre de la especialidad (ya que es pase a especialidad)
    let especialidad = null;
    if (consulta.especialidadinterconsulta) {
      const espResult = await pool
        .request()
        .input("claveespecialidad", sql.Int, consulta.especialidadinterconsulta)
        .query(`SELECT especialidad FROM especialidades WHERE claveespecialidad = @claveespecialidad`);
      if (espResult.recordset.length) {
        especialidad = espResult.recordset[0].especialidad;
      }
    }

    return res.status(200).json({
      data: {
        nombrepaciente: consulta.nombrepaciente,
        edad: consulta.edad,
        departamento: consulta.departamento,
        nombreproveedor,
        especialidad, //* Sólo se asigna si es pase a especialidad
      },
    });
  } catch (error) {
    console.error("Error al buscar consulta:", error);
    return res.status(500).json({
      message: "Error al buscar la consulta",
      error: error.message,
    });
  }
}
