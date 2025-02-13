import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("❌ Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("📨 Datos recibidos en el backend:", req.body);

  const { medicamentos = [], folioReceta, decisionTomada } = req.body;

  //* Validar que el payload tenga los campos esperados
  if (!folioReceta || decisionTomada === undefined) {
    console.error("❌ Faltan datos obligatorios en el payload.");
    return res.status(400).json({
      error: "El payload debe contener 'folioReceta' y 'decisionTomada'.",
    });
  }

  try {
    console.log("🌐 Conectando a la base de datos...");
    const pool = await connectToDatabase();
    console.log("🌐 Conexión establecida con éxito.");

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const queryInsertarReceta = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleReceta]
      (folioReceta, descMedicamento, indicaciones, estatus, cantidad, piezas)
      VALUES (@folioReceta, @descMedicamento, @indicaciones, @estatus, @cantidad, @piezas)
    `;

    const resultados = [];

    if (decisionTomada === "no") {
      //! Insertar valores predeterminados si la decisión es "No"
      console.log("⚠️ Decisión tomada: No. Insertando valores predeterminados.");
      await transaction.request()
        .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
        .input("descMedicamento", sql.Int, 0)
        .input(
          "indicaciones",
          sql.NVarChar,
          "Sin indicaciones ya que no se asignaron medicamentos."
        )
        .input("estatus", sql.Int, 1)
        .input(
          "cantidad",
          sql.NVarChar,
          "Sin tiempo de toma estimado, sin medicamentos."
        )
        .input(
          "piezas",
          sql.Int,
          0
        )
        .query(queryInsertarReceta);

      resultados.push({
        folioReceta,
        status: "success",
        message: "Registro predeterminado insertado.",
      });
    } else {
      //* Insertar medicamentos reales
      for (const med of medicamentos) {
        const { descMedicamento, indicaciones, cantidad, piezas } = med;

        if (!descMedicamento || !indicaciones || !cantidad || !piezas) {
          console.error("❌ Medicamento tiene campos faltantes:", med);
          await transaction.rollback();
          return res.status(400).json({
            message: "Error: Medicamento tiene campos faltantes.",
          });
        }

        await transaction.request()
          .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
          .input("descMedicamento", sql.Int, parseInt(descMedicamento, 10))
          .input("indicaciones", sql.NVarChar, indicaciones.trim())
          .input("estatus", sql.Int, 1)
          .input("cantidad", sql.NVarChar, cantidad.trim())
          .input("piezas", sql.Int, parseInt(piezas, 10))
          .query(queryInsertarReceta);

        resultados.push({
          medicamento: med,
          status: "success",
        });
      }
    }

    await transaction.commit();
    console.log("✅ Transacción completada con éxito.");
    res.status(200).json({ message: "Datos guardados correctamente.", resultados });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
}
