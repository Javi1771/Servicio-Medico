import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  let { folioReceta } = req.body;
  //console.log("🔹 Folio recibido en la API:", folioReceta);

  // Validación de folioReceta
  if (!folioReceta || isNaN(folioReceta) || parseInt(folioReceta, 10) <= 0) {
    console.warn("⚠️ Folio inválido recibido:", folioReceta);
    return res.status(400).json({ message: "Folio inválido. Debe ser un número entero positivo." });
  }

  folioReceta = parseInt(folioReceta, 10); // Convertir a número
  //console.log("✅ Folio convertido a número:", folioReceta);

  try {
    const pool = await connectToDatabase();
    //console.log("🔹 Conexión a la base de datos exitosa");

    // Buscar en la tabla SURTIMIENTOS para obtener el FOLIO_SURTIMIENTO más reciente
    //console.log("🔍 Buscando en SURTIMIENTOS con FOLIO_PASE:", folioReceta);
    const surtimientoResult = await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .query(`
        SELECT TOP 1 FOLIO_SURTIMIENTO 
        FROM SURTIMIENTOS
        WHERE FOLIO_PASE = @folioReceta
          AND ESTATUS = 1
        ORDER BY FOLIO_SURTIMIENTO DESC
      `);

    //console.log("📌 Resultado de SURTIMIENTOS:", surtimientoResult.recordset);

    if (surtimientoResult.recordset.length > 0) {
      const folioSurtimiento = surtimientoResult.recordset[0].FOLIO_SURTIMIENTO;
      //console.log("✅ Se encontró el FOLIO_SURTIMIENTO más reciente:", folioSurtimiento);

      // Si existe el surtimiento, obtenemos los medicamentos de detalleSurtimientos
      //console.log("🔍 Buscando medicamentos en detalleSurtimientos...");
      const medicamentosSurtidos = await pool
        .request()
        .input("folioSurtimiento", sql.Int, folioSurtimiento)
        .query(`
          SELECT 
            ds.claveMedicamento,
            ds.indicaciones,
            ds.cantidad,
            ds.piezas, 
            m.MEDICAMENTO AS nombreMedicamento
          FROM detalleSurtimientos AS ds
          JOIN MEDICAMENTOS AS m 
            ON ds.claveMedicamento = m.CLAVEMEDICAMENTO
          WHERE ds.folioSurtimiento = @folioSurtimiento
            AND m.estatus = 1
        `);

      //console.log("📌 Medicamentos obtenidos de detalleSurtimientos:", medicamentosSurtidos.recordset);

      if (medicamentosSurtidos.recordset.length === 0) {
        console.warn("⚠️ No se encontraron medicamentos en detalleSurtimientos.");
      }

      return res.status(200).json(medicamentosSurtidos.recordset);
    }

    // Si no existe en SURTIMIENTOS, buscamos en detalleReceta
    //console.log("🔍 No se encontró en SURTIMIENTOS, buscando en detalleReceta...");
    const medicamentosReceta = await pool
      .request()
      .input("folioReceta", sql.Int, folioReceta)
      .query(`
        SELECT 
          dr.descMedicamento AS claveMedicamento,
          dr.indicaciones,
          dr.cantidad,
          dr.piezas,  -- Aquí también agregas el campo piezas
          m.MEDICAMENTO AS nombreMedicamento
        FROM detalleReceta AS dr
        JOIN MEDICAMENTOS AS m 
          ON dr.descMedicamento = m.CLAVEMEDICAMENTO
        WHERE dr.folioReceta = @folioReceta
      `);

    //console.log("📌 Medicamentos obtenidos de detalleReceta:", medicamentosReceta.recordset);

    if (medicamentosReceta.recordset.length === 0) {
      console.warn("⚠️ No se encontraron medicamentos en detalleReceta.");
    }

    return res.status(200).json(medicamentosReceta.recordset);
  } catch (error) {
    console.error("❌ Error en la consulta de medicamentos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
