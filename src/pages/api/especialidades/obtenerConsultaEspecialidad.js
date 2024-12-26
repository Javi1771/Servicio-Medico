import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  const { folio } = req.query;

  console.log("🔍 Endpoint - obtenerConsultaEspecialidad");
  console.log("📌 Parámetro recibido - Folio:", folio); 

  if (req.method !== "GET") {
    console.log("❌ Método no permitido:", req.method); 
    return res.status(405).json({ error: "Método no permitido" });
  }

  const folioInt = parseInt(folio, 10);
  if (isNaN(folioInt)) {
    console.log("❌ El parámetro 'folio' no es un número válido:", folio);
    return res
      .status(400)
      .json({ error: "El parámetro 'folio' debe ser un número válido" });
  }

  try {
    const pool = await connectToDatabase();
    console.log("✅ Conexión exitosa a la base de datos");

    //? 1. Obtener datos de "consultas"
    console.log("📄 Ejecutando consulta a 'consultas'");
    const consultaQuery = `
        SELECT claveconsulta, nombrepaciente, edad, parentesco, sindicato, clavenomina, clavepaciente, elpacienteesempleado, departamento
        FROM consultas
        WHERE claveconsulta = @folio
    `;
    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, folioInt)
      .query(consultaQuery);

    console.log("📊 Resultado de 'consultas':", consultaResult.recordset);

    if (consultaResult.recordset.length === 0) {
      console.log("⚠️ No se encontró ninguna consulta con el folio:", folio);
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    //* Extraemos los datos de la primera fila (debe haber una sola fila para este folio)
    const consulta = consultaResult.recordset[0];

    //* Validamos que el campo parentesco sea un valor único
    if (Array.isArray(consulta.parentesco)) {
      console.warn("⚠️ El campo 'parentesco' se recibió como un arreglo. Corrigiendo...");
      consulta.parentesco = consulta.parentesco[0]; // Tomar el primer valor del arreglo
    }

    console.log("📋 Consulta después de procesar el parentesco:", consulta);

    //? 2. Obtener parentesco (nombre o etiqueta)
    console.log("🔍 Determinando parentesco");
    let parentescoNombre = "EMPLEADO"; // Valor por defecto si es empleado

    if (consulta.parentesco === 0 || consulta.parentesco === "Empleado") {
      console.log("ℹ️ Parentesco identificado directamente como EMPLEADO");
      parentescoNombre = "EMPLEADO";
    } else if (!isNaN(consulta.parentesco)) {
      console.log(
        "🔍 Buscando parentesco en 'PARENTESCO' para ID:",
        consulta.parentesco
      );
      const parentescoQuery = `
        SELECT PARENTESCO
        FROM PARENTESCO
        WHERE ID_PARENTESCO = @parentescoId
      `;
      const parentescoResult = await pool
        .request()
        .input("parentescoId", sql.Int, consulta.parentesco)
        .query(parentescoQuery);

      console.log("📊 Resultado de 'PARENTESCO':", parentescoResult.recordset);

      if (parentescoResult.recordset.length > 0) {
        parentescoNombre = parentescoResult.recordset[0].PARENTESCO;
      } else {
        console.log("⚠️ No se encontró un parentesco para el ID proporcionado");
      }
    } else {
      console.log("⚠️ Valor inesperado en parentesco:", consulta.parentesco);
    }

    //? 3. Obtener especialidad
    console.log(
      "📄 Ejecutando consulta a 'detalleEspecialidad' y 'especialidades'..."
    );
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

    console.log(
      "📊 Resultado de 'especialidades':",
      especialidadResult.recordset
    );

    if (especialidadResult.recordset.length === 0) {
      console.log(
        "⚠️ No se encontró ninguna especialidad para el folio:",
        folio
      );
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }

    const especialidad = especialidadResult.recordset[0];

    //? 4. Obtener especialistas
    console.log(
      "🔍 Buscando especialistas con claveEspecialidad:",
      especialidad.claveespecialidad
    );

    const especialistasQuery = `
      SELECT claveproveedor, nombreproveedor, costo
      FROM proveedores
      WHERE claveespecialidad = @claveEspecialidad
      ORDER BY nombreproveedor ASC
    `;
    const especialistasResult = await pool
      .request()
      .input("claveEspecialidad", sql.Int, especialidad.claveespecialidad)
      .query(especialistasQuery);

    console.log(
      "📊 Resultado de 'proveedores':",
      especialistasResult.recordset
    );

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
