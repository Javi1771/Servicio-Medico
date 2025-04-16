import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveConsulta, clavestatus } = req.body;

  if (!claveConsulta || clavestatus === undefined) {
    console.error("❌ Datos incompletos:", { claveConsulta, clavestatus });
    return res.status(400).json({ message: "Datos incompletos." });
  }

  if (![0, 1, 2].includes(clavestatus)) {
    console.error("❌ Clavestatus inválido:", clavestatus);
    return res.status(400).json({
      message: "El valor de clavestatus no es válido. Solo se permiten 0, 1 y 2.",
    });
  }

  try {
    const pool = await connectToDatabase();

    //console.log("📋 Verificando estado actual de la consulta...");
    const consultaActual = await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .query(`
        SELECT clavestatus
        FROM consultas
        WHERE claveconsulta = @claveconsulta
      `);

    if (consultaActual.recordset.length === 0) {
      console.error("❌ Consulta no encontrada:", claveConsulta);
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    //console.log("📋 Estado actual:", consultaActual.recordset[0]?.clavestatus);

    const updateResult = await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .input("clavestatus", sql.Int, clavestatus)
      .query(`
        UPDATE consultas
        SET clavestatus = @clavestatus
        WHERE claveconsulta = @claveconsulta
      `);

    //console.log("📋 Resultado del UPDATE:", updateResult);

    if (updateResult.rowsAffected[0] === 0) {
      console.error("⚠️ No se actualizó ninguna fila. Verifica los datos enviados.");
      return res
        .status(404)
        .json({ message: "Consulta no encontrada o ya actualizada." });
    }

    const consultaActualizada = await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .query(`
        SELECT clavestatus
        FROM consultas
        WHERE claveconsulta = @claveconsulta
      `);

    console.log(
      "📋 Clavestatus después del UPDATE:",
      consultaActualizada.recordset[0]?.clavestatus
    );

    res.status(200).json({ message: "Estado actualizado correctamente." });
  } catch (error) {
    console.error("[ERROR] Error general:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}
