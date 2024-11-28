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
    } = req.body;

    if (
      !ean ||
      !medicamento ||
      !piezas ||
      !indicaciones ||
      !tratamiento ||
      !nombrePaciente ||
      !claveConsulta ||
      !nombreMedico
    ) {
      return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
      const pool = await connectToDatabase();

      //* Verificar piezas disponibles
      const queryObtenerPiezas = `
        SELECT piezas 
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS_FARMACIA] 
        WHERE ean = @ean
      `;
      const result = await pool
        .request()
        .input("ean", ean)
        .query(queryObtenerPiezas);
      const piezasDisponibles = result.recordset[0]?.piezas;

      if (!piezasDisponibles || piezasDisponibles < piezas) {
        return res.status(400).json({ error: "Piezas insuficientes" });
      }

      //* Actualizar piezas disponibles
      const queryActualizarPiezas = `
        UPDATE [PRESIDENCIA].[dbo].[MEDICAMENTOS_FARMACIA] 
        SET piezas = piezas - @piezas 
        WHERE ean = @ean
      `;
      await pool
        .request()
        .input("ean", ean)
        .input("piezas", piezas)
        .query(queryActualizarPiezas);

      //* Insertar en historial
      const queryInsertarHistorial = `
        INSERT INTO [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] 
        (ean, sustancia, nombre_paciente, piezas_otorgadas, indicaciones, tratamiento, claveconsulta, fecha_otorgacion, nombre_medico) 
        VALUES (@ean, @medicamento, @nombrePaciente, @piezas, @indicaciones, @tratamiento, @claveConsulta, @nombreMedico, GETDATE())
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
