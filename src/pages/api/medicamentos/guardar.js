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

      // Confirmación de éxito
      console.log("Medicamento guardado exitosamente en la base de datos");
      res.status(200).json({ message: "Medicamento guardado exitosamente" });
    } catch (error) {
      // Log detallado del error
      console.error("Error al guardar medicamento en la base de datos:", error);
      res.status(500).json({ error: "Error al guardar medicamento" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
