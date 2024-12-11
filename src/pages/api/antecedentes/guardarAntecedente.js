import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import { pusher } from "../pusher";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    descripcion,
    clavenomina,
    nombrePaciente,
    clavepaciente,
    tipoAntecedente,
    fechaInicioEnfermedad,
  } = req.body;

  if (
    !descripcion ||
    !clavenomina ||
    !nombrePaciente ||
    !clavepaciente ||
    !tipoAntecedente ||
    !fechaInicioEnfermedad
  ) {
    return res.status(400).json({ message: "Datos incompletos." });
  }

  try {
    const pool = await connectToDatabase();

    //* Insertar el nuevo antecedente
    await pool
      .request()
      .input("descripcion", sql.NVarChar(sql.MAX), descripcion)
      .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
      .input("nombre_paciente", sql.NVarChar(sql.MAX), nombrePaciente)
      .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente)
      .input("tipo_antecedente", sql.NVarChar(sql.MAX), tipoAntecedente)
      .input("fecha_inicio_enfermedad", sql.DateTime, fechaInicioEnfermedad)
      .query(`
        INSERT INTO antecedentes_clinicos (descripcion, clavenomina, clavepaciente, nombre_paciente, tipo_antecedente, fecha_inicio_enfermedad)
        VALUES (@descripcion, @clavenomina, @clavepaciente, @nombre_paciente, @tipo_antecedente, @fecha_inicio_enfermedad)
      `);

    //* Obtener el historial actualizado
    const result = await pool
      .request()
      .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
      .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente).query(`
        SELECT id_antecedente, descripcion, clavenomina, nombre_paciente, tipo_antecedente, fecha_registro, fecha_inicio_enfermedad
        FROM antecedentes_clinicos
        WHERE clavenomina = @clavenomina
          AND clavepaciente = @clavepaciente
      `);

    const historial = result.recordset;

    //* Emitir evento a Pusher
    await pusher.trigger("antecedentes-channel", "antecedentes-updated", {
      clavenomina,
      clavepaciente,
      antecedentes: historial,
    });
    console.log("Evento emitido a Pusher:", {
      clavenomina,
      clavepaciente,
      antecedentes: historial,
    });

    res.status(200).json({
      message: "Antecedente guardado correctamente.",
      nuevoAntecedente: historial,
    });
  } catch (error) {
    console.error("Error al guardar el antecedente:", error);
    res
      .status(500)
      .json({ message: "Error al guardar el antecedente.", error });
  }
}
