import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("Datos recibidos en el backend:", req.body);

  const { folioReceta, descMedicamento, indicaciones, cantidad } = req.body;

  //* Validación de datos obligatorios
  if (!folioReceta || descMedicamento === undefined || !indicaciones || !cantidad) {
    console.error("Faltan datos obligatorios en la solicitud:", req.body);
    return res.status(400).json({ error: "Faltan datos obligatorios en la solicitud" });
  }

  try {
    const pool = await connectToDatabase();

    console.log("Preparando datos para la base de datos:", {
      folioReceta,
      descMedicamento,
      indicaciones,
      cantidad,
    });

    //* Validación adicional de tipo de datos
    const folio = parseInt(folioReceta, 10);
    const medicamentoId = parseInt(descMedicamento, 10);

    if (isNaN(folio) || isNaN(medicamentoId)) {
      console.error("Los datos proporcionados no son válidos:", {
        folio,
        medicamentoId,
        cantidad,
      });
      return res.status(400).json({ error: "Los datos proporcionados no son válidos" });
    }

    let medicamentoNombre = "Medicamento no especificado";

    //* Si descMedicamento es 0, asignar valores predeterminados para `indicaciones` y `cantidad`
    if (medicamentoId !== 0) {
      const queryObtenerMedicamento = `
        SELECT MEDICAMENTO
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS]
        WHERE CLAVEMEDICAMENTO = @medicamentoId
      `;

      console.log("Ejecutando query para obtener el nombre del medicamento...");
      const medicamentoResult = await pool
        .request()
        .input("medicamentoId", sql.Int, medicamentoId)
        .query(queryObtenerMedicamento);

      if (medicamentoResult.recordset.length === 0) {
        console.error("El medicamento no fue encontrado en la base de datos.");
        return res.status(404).json({ error: "Medicamento no encontrado" });
      }

      medicamentoNombre = medicamentoResult.recordset[0].MEDICAMENTO;
      console.log("Medicamento encontrado:", medicamentoNombre);
    } else {
      console.log("MedicamentoId es 0. Usando valores predeterminados para `indicaciones` y `cantidad`.");
      medicamentoNombre = "0"; // Guardar "0" en descMedicamento
    }

    //* Query para insertar en la tabla `detalleReceta`
    const queryInsertarReceta = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleReceta]
      (folioReceta, descMedicamento, indicaciones, estatus, cantidad)
      VALUES (@folioReceta, @medicamentoNombre, @indicaciones, @estatus, @cantidad)
    `;

    const valoresInsertar = {
      indicaciones:
        medicamentoId === 0
          ? "Sin indicaciones ya que no se asignaron medicamentos."
          : indicaciones,
      cantidad:
        medicamentoId === 0
          ? "Sin tiempo de toma estimado, sin medicamentos."
          : cantidad,
    };

    console.log("Ejecutando query para insertar en detalleReceta...");
    await pool
      .request()
      .input("folioReceta", sql.Int, folio)
      .input("medicamentoNombre", sql.NVarChar, medicamentoNombre)
      .input("indicaciones", sql.NVarChar, valoresInsertar.indicaciones)
      .input("estatus", sql.Int, 1) //* Estatus fijo como 1
      .input("cantidad", sql.NVarChar, valoresInsertar.cantidad)
      .query(queryInsertarReceta);

    console.log("Detalle de receta guardado exitosamente en la base de datos.");

    res.status(200).json({
      message: "Receta guardada correctamente.",
    });
  } catch (error) {
    console.error("Error al guardar detalle de receta en la base de datos:", error);

    //* Manejo de errores específicos
    res.status(500).json({ error: "Error inesperado en el servidor" });
  }
}
