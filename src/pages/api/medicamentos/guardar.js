import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("Datos recibidos en el backend:", req.body);

  const {
    ean,
    medicamento,
    piezas,
    indicaciones,
    tratamiento,
    claveConsulta,
    claveEspecialidad,
    clavenomina,
    clavepaciente,
  } = req.body;

  if (
    !ean ||
    !medicamento ||
    !piezas ||
    !indicaciones ||
    !tratamiento ||
    !claveConsulta ||
    !claveEspecialidad ||
    !clavenomina ||
    !clavepaciente
  ) {
    console.error("Faltan datos en la solicitud:", req.body);
    return res.status(400).json({ error: "Faltan datos en la solicitud" });
  }

  try {
    const pool = await connectToDatabase();

    console.log("Preparando datos para la base de datos:", {
      ean,
      medicamento,
      piezas,
      indicaciones,
      tratamiento,
      claveConsulta,
      claveEspecialidad,
      clavenomina,
      clavepaciente,
    });

    // Aquí asumimos que:
    // - claveConsulta es un número en la base de datos (INT)
    // - claveEspecialidad es numérico (INT)
    // - clavenomina y clavepaciente pueden contener letras, así que deben ser VARCHAR
    // - ean es un texto largo, asegúrate que la columna en la BD sea lo suficientemente grande (por ejemplo, VARCHAR(50))

    const queryInsertarHistorial = `
      INSERT INTO [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] 
      (ean, sustancia, piezas_otorgadas, indicaciones, tratamiento, claveconsulta, fecha_otorgacion, id_especialidad, clave_nomina, clavepaciente) 
      VALUES (@ean, @medicamento, @piezas, @indicaciones, @tratamiento, @claveConsulta, GETDATE(), @claveEspecialidad, @clavenomina, @clavepaciente)
    `;

    await pool
      .request()
      .input("ean", sql.VarChar, ean)  // ean es texto
      .input("medicamento", sql.VarChar, medicamento) // medicamento es texto
      .input("piezas", sql.Int, parseInt(piezas, 10)) // piezas es numérico
      .input("indicaciones", sql.NVarChar, indicaciones) // indicaciones es texto
      .input("tratamiento", sql.NVarChar, tratamiento) // tratamiento es texto
      .input("claveConsulta", sql.Int, parseInt(claveConsulta, 10)) // claveConsulta es numérico
      .input("claveEspecialidad", sql.Int, parseInt(claveEspecialidad, 10)) // claveEspecialidad es numérico
      .input("clavenomina", sql.VarChar, clavenomina) // clavenomina es texto (tiene letras)
      .input("clavepaciente", sql.VarChar, clavepaciente) // clavepaciente es texto (tiene letras)
      .query(queryInsertarHistorial);

    console.log("Medicamento guardado exitosamente en la base de datos");

    const queryActualizarStock = `
      UPDATE [PRESIDENCIA].[dbo].[MEDICAMENTOS_FARMACIA]
      SET piezas = piezas - @piezas
      WHERE ean = @ean
    `;

    const resultadoStock = await pool
      .request()
      .input("ean", sql.VarChar, ean)
      .input("piezas", sql.Int, parseInt(piezas, 10))
      .query(queryActualizarStock);

    if (resultadoStock.rowsAffected[0] === 0) {
      console.warn("No se actualizó el stock. EAN inexistente.");
      return res
        .status(400)
        .json({ error: "No se encontró el medicamento en la farmacia." });
    }

    console.log("Stock del medicamento actualizado correctamente");

    const queryHistorial = `
      SELECT 
        mp.fecha_otorgacion AS fecha,
        mp.sustancia AS medicamento,
        mp.piezas_otorgadas AS piezas,
        mp.indicaciones,
        mp.tratamiento,
        mp.clave_nomina AS clavenomina,
        mp.claveconsulta,
        mp.clavepaciente,
        mp.id_especialidad AS claveespecialidad
      FROM [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] mp
      WHERE mp.clavepaciente = @clavepaciente
      ORDER BY mp.fecha_otorgacion DESC
    `;

    const historialResult = await pool
      .request()
      .input("clavepaciente", sql.VarChar, clavepaciente)
      .query(queryHistorial);

    const historial = historialResult.recordset;

    console.log("Enviando evento Pusher...");
    await pusher.trigger("medicamentos-channel", "historial-updated", {
      clavepaciente,
      historial,
    });

    console.log("Evento Pusher emitido con éxito");

    res.status(200).json({
      message:
        "Medicamento guardado, stock actualizado y evento emitido correctamente.",
    });
  } catch (error) {
    console.error("Error al guardar medicamento en la base de datos:", error);
    res.status(500).json({ error: "Error al guardar medicamento" });
  }
}
