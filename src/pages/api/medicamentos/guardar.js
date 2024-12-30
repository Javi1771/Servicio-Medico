import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("🚫 Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("🚀 Datos recibidos en el backend:", req.body);

  // Validar si `req.body` es un array y extraer el primer elemento
  const datos = Array.isArray(req.body) ? req.body[0] : req.body;
  const { folioReceta, descMedicamento, indicaciones, cantidad } = datos;

  console.log("🔍 Datos procesados para validación:");
  console.log("   ➡️ folioReceta:", folioReceta);
  console.log("   ➡️ descMedicamento:", descMedicamento);
  console.log("   ➡️ indicaciones:", indicaciones);
  console.log("   ➡️ cantidad:", cantidad);

  // Validación de datos obligatorios
  if (!folioReceta || descMedicamento === undefined || !indicaciones || !cantidad) {
    console.error("⚠️ Faltan datos obligatorios en la solicitud:");
    if (!folioReceta) console.error("🛑 Faltante: folioReceta");
    if (descMedicamento === undefined) console.error("🛑 Faltante: descMedicamento");
    if (!indicaciones) console.error("🛑 Faltante: indicaciones");
    if (!cantidad) console.error("🛑 Faltante: cantidad");

    return res.status(400).json({ error: "Faltan datos obligatorios en la solicitud" });
  }

  try {
    console.log("🌐 Conectando a la base de datos...");
    const pool = await connectToDatabase();

    console.log("🌐 Conexión establecida con éxito.");

    // Validación adicional de tipo de datos
    const folio = parseInt(folioReceta, 10);
    const medicamentoId = parseInt(descMedicamento, 10);

    console.log("🔍 Validando tipos de datos:");
    console.log("   ➡️ folioReceta (convertido):", folio);
    console.log("   ➡️ descMedicamento (convertido):", medicamentoId);
    console.log("   ➡️ indicaciones:", indicaciones);
    console.log("   ➡️ cantidad:", cantidad);

    if (isNaN(folio) || isNaN(medicamentoId)) {
      console.error("🛑 Los datos proporcionados no son válidos:", {
        folio,
        medicamentoId,
        cantidad,
      });
      return res.status(400).json({ error: "Los datos proporcionados no son válidos" });
    }

    // Preparar query para insertar en detalleReceta
    const queryInsertarReceta = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleReceta]
      (folioReceta, descMedicamento, indicaciones, estatus, cantidad)
      VALUES (@folioReceta, @descMedicamento, @indicaciones, @estatus, @cantidad)
    `;

    console.log("📝 Preparando valores para la inserción en detalleReceta:");
    console.log("   ➡️ folioReceta:", folio);
    console.log("   ➡️ descMedicamento (ID):", medicamentoId);
    console.log("   ➡️ indicaciones:", indicaciones);
    console.log("   ➡️ cantidad:", cantidad);

    console.log("🛠️ Ejecutando query para insertar en detalleReceta...");
    await pool
      .request()
      .input("folioReceta", sql.Int, folio)
      .input("descMedicamento", sql.Int, medicamentoId)
      .input("indicaciones", sql.NVarChar, indicaciones)
      .input("estatus", sql.Int, 1) // Estatus fijo como 1
      .input("cantidad", sql.NVarChar, cantidad)
      .query(queryInsertarReceta);

    console.log("✅ Detalle de receta guardado exitosamente en la base de datos.");

    res.status(200).json({
      message: "Receta guardada correctamente.",
    });
  } catch (error) {
    console.error("🛑 Error al guardar detalle de receta en la base de datos:", error);
    res.status(500).json({ error: "Error inesperado en el servidor" });
  }
}
