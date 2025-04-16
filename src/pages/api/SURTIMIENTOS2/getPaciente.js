import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;

  if (!folio) {
    return res.status(400).json({ message: "El folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();
    //console.log("Conectado a la base de datos. Buscando información del paciente...");

    // Paso 1: Obtener datos del paciente
    const pacienteResult = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(`
        SELECT nombrepaciente, edad, departamento, parentesco
        FROM consultas
        WHERE claveconsulta = @folio
      `);

    if (pacienteResult.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró información del paciente." });
    }

    const paciente = pacienteResult.recordset[0];
    let nombreParentesco = paciente.parentesco; // Valor por defecto

    // Paso 2: Verificar si es número o texto
    const parentescoNum = parseInt(paciente.parentesco, 10);

    if (!isNaN(parentescoNum)) {
      // Caso 1: Es un número
      if (parentescoNum === 0) {
        nombreParentesco = "Empleado";
      } else {
        // Consultar tabla PARENTES
        const parentescoResult = await pool
          .request()
          .input("idParentesco", sql.Int, parentescoNum)
          .query(`
            SELECT PARENTESCO
            FROM PARENTESCO
            WHERE ID_PARENTESCO = @idParentesco
          `);

        nombreParentesco = parentescoResult.recordset.length > 0 
          ? parentescoResult.recordset[0].PARENTESCO 
          : "No registrado";
      }
    } else {
      // Caso 2: Es texto (ej: "Hijo(a)"), se mantiene el valor original
      nombreParentesco = paciente.parentesco;
    }

    // Actualizar el valor del parentesco
    paciente.parentesco = nombreParentesco;

    return res.status(200).json(paciente);
  } catch (error) {
    console.error("Error al obtener datos del paciente:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}