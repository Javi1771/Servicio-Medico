import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Log detallado de los datos recibidos
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
    } = req.body;

    // Validación detallada de los datos recibidos
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
      !clavenomina
    ) {
      console.error("Faltan datos en la solicitud:", req.body);
      return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
      const pool = await connectToDatabase();

      // Log antes de ejecutar la consulta
      console.log("Datos listos para insertar en la base de datos:", {
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
      });

      // Insertar en la tabla de historial de medicamentos
      const queryInsertarHistorial = `
        INSERT INTO [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] 
        (ean, sustancia, nombre_paciente, piezas_otorgadas, indicaciones, tratamiento, claveconsulta, fecha_otorgacion, nombre_medico, id_especialidad, clave_nomina) 
        VALUES (@ean, @medicamento, @nombrePaciente, @piezas, @indicaciones, @tratamiento, @claveConsulta, GETDATE(), @nombreMedico, @claveEspecialidad, @clavenomina)
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
        .query(queryInsertarHistorial);

      console.log("Medicamento guardado exitosamente en la base de datos");

      // Actualizar el stock del medicamento en la tabla MEDICAMENTOS_FARMACIA
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
        console.warn(
          "No se actualizó el stock. Verifica que el EAN exista en la tabla MEDICAMENTOS_FARMACIA."
        );
        return res
          .status(400)
          .json({ error: "No se encontró el medicamento en la farmacia." });
      }

      console.log("Stock del medicamento actualizado correctamente");

      res
        .status(200)
        .json({ message: "Medicamento guardado y stock actualizado correctamente" });
    } catch (error) {
      // Log detallado del error
      console.error("Error al guardar medicamento en la base de datos:", error);
      res.status(500).json({ error: "Error al guardar medicamento" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
