import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  //* Log de los datos recibidos
  console.log("Datos recibidos en el backend:", req.body);

  const {
    ean,
    medicamento,
    piezas,
    indicaciones,
    tratamiento,
    nombrePaciente,
    claveConsulta,
    nombreMedico,
    claveEspecialidad,
    clavenomina,
    clavepaciente,
  } = req.body;

  //* Validación de datos obligatorios
  if (
    !ean ||
    !medicamento ||
    !piezas ||
    !indicaciones ||
    !tratamiento ||
    !nombrePaciente ||
    !claveConsulta ||
    !nombreMedico ||
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
      nombrePaciente,
      claveConsulta,
      nombreMedico,
      claveEspecialidad,
      clavenomina,
      clavepaciente,
    });

    //* Insertar en la tabla de historial de medicamentos
    const queryInsertarHistorial = `
      INSERT INTO [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] 
      (ean, sustancia, nombre_paciente, piezas_otorgadas, indicaciones, tratamiento, claveconsulta, fecha_otorgacion, nombre_medico, id_especialidad, clave_nomina, clavepaciente) 
      VALUES (@ean, @medicamento, @nombrePaciente, @piezas, @indicaciones, @tratamiento, @claveConsulta, GETDATE(), @nombreMedico, @claveEspecialidad, @clavenomina, @clavepaciente)
    `;

    await pool
      .request()
      .input("ean", sql.VarChar, ean)
      .input("medicamento", sql.VarChar, medicamento)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .input("piezas", sql.Int, piezas)
      .input("indicaciones", sql.NVarChar, indicaciones)
      .input("tratamiento", sql.NVarChar, tratamiento)
      .input("claveConsulta", sql.Int, claveConsulta)
      .input("nombreMedico", sql.NVarChar, nombreMedico)
      .input("claveEspecialidad", sql.Int, claveEspecialidad)
      .input("clavenomina", sql.VarChar, clavenomina)
      .input("clavepaciente", sql.Int, clavepaciente)
      .query(queryInsertarHistorial);

    console.log("Medicamento guardado exitosamente en la base de datos");

    //* Actualizar el stock del medicamento en la tabla MEDICAMENTOS_FARMACIA
    const queryActualizarStock = `
      UPDATE [PRESIDENCIA].[dbo].[MEDICAMENTOS_FARMACIA]
      SET piezas = piezas - @piezas
      WHERE ean = @ean
    `;

    const resultadoStock = await pool
      .request()
      .input("ean", sql.VarChar, ean)
      .input("piezas", sql.Int, piezas)
      .query(queryActualizarStock);

    if (resultadoStock.rowsAffected[0] === 0) {
      console.warn("No se actualizó el stock. EAN inexistente.");
      return res.status(400).json({ error: "No se encontró el medicamento en la farmacia." });
    }

    console.log("Stock del medicamento actualizado correctamente");

    //* Obtener historial actualizado
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
        mp.id_especialidad AS claveespecialidad,
        mp.nombre_medico
      FROM [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] mp
      WHERE mp.clavepaciente = @clavepaciente
      ORDER BY mp.fecha_otorgacion DESC
    `;

    const historialResult = await pool
      .request()
      .input("clavepaciente", sql.Int, clavepaciente)
      .query(queryHistorial);

    const historial = historialResult.recordset;

    //* Emitir evento Pusher
    console.log("Enviando evento Pusher...");
    await pusher.trigger("medicamentos-channel", "historial-updated", {
      clavepaciente,
      historial,
    });

    console.log("Evento Pusher emitido con éxito");

    res.status(200).json({
      message: "Medicamento guardado, stock actualizado y evento emitido correctamente.",
    });
  } catch (error) {
    console.error("Error al guardar medicamento en la base de datos:", error);
    res.status(500).json({ error: "Error al guardar medicamento" });
  }
}
