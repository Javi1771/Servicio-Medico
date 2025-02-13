import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  let { folioReceta } = req.body;
  console.log("🔹 Folio recibido en la API:", folioReceta);

  // Validación de folioReceta
  if (!folioReceta || isNaN(folioReceta) || parseInt(folioReceta, 10) <= 0) {
    console.warn("⚠️ Folio inválido recibido:", folioReceta);
    return res.status(400).json({ message: "Folio inválido. Debe ser un número entero positivo." });
  }

  folioReceta = parseInt(folioReceta, 10); // Convertir a número
  console.log("✅ Folio convertido a número:", folioReceta);

  try {
    const pool = await connectToDatabase();
    console.log("🔹 Conexión a la base de datos exitosa");

    // Buscar en la tabla SURTIMIENTOS para obtener el folio de surtimiento
    console.log("🔍 Buscando en SURTIMIENTOS con FOLIO_PASE:", folioReceta);
    const surtimientoResult = await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .query(`
        SELECT
          dr.idDetalleReceta,
          dr.folioReceta,
          dr.indicaciones,
          dr.cantidad,
          m.medicamento AS nombreMedicamento,
          m.claveMedicamento AS claveMedicamento
        FROM [PRESIDENCIA].[dbo].[detalleReceta] AS dr
        JOIN [PRESIDENCIA].[dbo].[MEDICAMENTOS_NEW] AS m
          ON dr.descMedicamento = m.claveMedicamento
        WHERE dr.folioReceta = @folio
      `);

    console.log("📌 Resultado de SURTIMIENTOS:", surtimientoResult.recordset);

    if (surtimientoResult.recordset.length > 0) {
      const folioSurtimiento = surtimientoResult.recordset[0].FOLIO_SURTIMIENTO;
      console.log("✅ Se encontró un FOLIO_SURTIMIENTO:", folioSurtimiento);

      // Si existe en SURTIMIENTOS, obtenemos los medicamentos de detalleSurtimientos
      console.log("🔍 Buscando medicamentos en detalleSurtimientos...");
      const medicamentosSurtidos = await pool
        .request()
        .input("folioSurtimiento", sql.Int, folioSurtimiento)
        .query(`
          SELECT 
            ds.claveMedicamento,
            ds.indicaciones,
            ds.cantidad,
            m.MEDICAMENTO AS nombreMedicamento
          FROM [PRESIDENCIA].[dbo].[detalleSurtimientos] AS ds
          JOIN [PRESIDENCIA].[dbo].[MEDICAMENTOS] AS m 
            ON ds.claveMedicamento = m.CLAVEMEDICAMENTO
          WHERE ds.folioSurtimiento = @folioSurtimiento
        `);

      console.log("📌 Medicamentos obtenidos de detalleSurtimientos:", medicamentosSurtidos.recordset);

      if (medicamentosSurtidos.recordset.length === 0) {
        console.warn("⚠️ No se encontraron medicamentos en detalleSurtimientos.");
      }

      return res.status(200).json(medicamentosSurtidos.recordset);
    }

    // Si no existe en SURTIMIENTOS, buscamos en detalleReceta
    console.log("🔍 No se encontró en SURTIMIENTOS, buscando en detalleReceta...");
    const medicamentosReceta = await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .query(`
        SELECT 
          dr.descMedicamento AS claveMedicamento,
          dr.indicaciones,
          dr.cantidad,
          m.MEDICAMENTO AS nombreMedicamento
        FROM [PRESIDENCIA].[dbo].[detalleReceta] AS dr
        JOIN [PRESIDENCIA].[dbo].[MEDICAMENTOS] AS m 
          ON dr.descMedicamento = m.CLAVEMEDICAMENTO
        WHERE dr.folioReceta = @folioReceta
      `);

    console.log("📌 Medicamentos obtenidos de detalleReceta:", medicamentosReceta.recordset);

    if (medicamentosReceta.recordset.length === 0) {
      console.warn("⚠️ No se encontraron medicamentos en detalleReceta.");
    }

    return res.status(200).json(medicamentosReceta.recordset);
  } catch (error) {
    console.error("❌ Error en la consulta de medicamentos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
