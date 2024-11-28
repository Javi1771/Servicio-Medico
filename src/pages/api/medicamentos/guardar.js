import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "POST") {
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
      clave_nomina,
    } = req.body;

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
      !clave_nomina 
    ) {
      return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
      const pool = await connectToDatabase();

      const queryInsertarHistorial = `
        INSERT INTO [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] 
        (ean, sustancia, nombre_paciente, piezas_otorgadas, indicaciones, tratamiento, claveconsulta, fecha_otorgacion, nombre_medico, id_especialidad, clave_nomina) 
        VALUES (@ean, @medicamento, @nombrePaciente, @piezas, @indicaciones, @tratamiento, @claveConsulta, GETDATE(), @nombreMedico, @claveEspecialidad, @clave_nomina)
      `;
      await pool
        .request()
        .input("ean", ean)
        .input("medicamento", medicamento)
        .input("nombrePaciente", nombrePaciente)
        .input("piezas", piezas)
        .input("indicaciones", indicaciones)
        .input("tratamiento", tratamiento)
        .input("claveConsulta", claveConsulta)
        .input("nombreMedico", nombreMedico)
        .input("claveEspecialidad", claveEspecialidad)
        .input("clave_nomina", clave_nomina)
        .query(queryInsertarHistorial);

      res.status(200).json({ message: "Medicamento guardado exitosamente" });
    } catch (error) {
      console.error("Error al guardar medicamento:", error);
      res.status(500).json({ error: "Error al guardar medicamento" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
