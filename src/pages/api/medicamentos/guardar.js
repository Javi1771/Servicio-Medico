import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("\uD83D\uDEAB Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("\uD83D\uDE80 Datos recibidos en el backend:", req.body);

  if (!Array.isArray(req.body)) {
    console.warn("⚠️ Payload no es un arreglo de medicamentos.");
    return res.status(400).json({ error: "El payload debe ser un arreglo de medicamentos." });
  }

  const medicamentos = req.body;

  try {
    console.log("\uD83C\uDF10 Conectando a la base de datos...");
    const pool = await connectToDatabase();
    console.log("\uD83C\uDF10 Conexión establecida con éxito.");

    //? Iniciar una transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const queryInsertarReceta = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleReceta]
      (folioReceta, descMedicamento, indicaciones, estatus, cantidad)
      VALUES (@folioReceta, @descMedicamento, @indicaciones, @estatus, @cantidad)
    `;

    const resultados = [];

    for (const [index, med] of medicamentos.entries()) {
      const { folioReceta, descMedicamento, indicaciones, cantidad } = med;

      //* Validación de campos obligatorios
      if (!folioReceta || !descMedicamento || !indicaciones || !cantidad) {
        console.error(`⚠️ Medicamento ${index + 1} tiene campos faltantes.`);
        resultados.push({
          medicamento: med,
          error: "Faltan datos obligatorios.",
        });
        //! Revertir transacción si hay errores
        await transaction.rollback();
        return res.status(400).json({
          message: "Error al procesar los datos.",
          resultados,
        });
      }

      try {
        //* Insertar medicamento en la base de datos
        await transaction.request()
          .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
          .input("descMedicamento", sql.Int, parseInt(descMedicamento, 10))
          .input("indicaciones", sql.NVarChar, indicaciones.trim())
          .input("estatus", sql.Int, 1) 
          .input("cantidad", sql.NVarChar, cantidad.trim())
          .query(queryInsertarReceta);

        console.log(`✅ Medicamento ${index + 1} guardado correctamente.`);
        resultados.push({ medicamento: med, status: "success" });
      } catch (error) {
        console.error(`❌ Error al guardar medicamento ${index + 1}:`, error.message);
        resultados.push({
          medicamento: med,
          error: error.message || "Error inesperado.",
        });
        //* Revertir transacción si hay errores
        await transaction.rollback();
        return res.status(500).json({
          message: "Error al guardar los medicamentos.",
          resultados,
        });
      }
    }

    //* Confirmar la transacción si no hay errores
    await transaction.commit();
    console.log("✅ Transacción completada con éxito.");

    res.status(200).json({
      message: "Todos los medicamentos se guardaron correctamente.",
      resultados,
    });
  } catch (error) {
    console.error("\uD83D\uDEAB Error inesperado al procesar medicamentos:", error);
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
}
