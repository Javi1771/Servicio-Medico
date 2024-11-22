import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { nombrePaciente } = req.query;

    if (!nombrePaciente) {
      return res.status(400).json({ ok: false, error: "El nombre del paciente es obligatorio" });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        SELECT 
          fecha_otorgacion AS fecha,
          sustancia AS medicamento,
          piezas_otorgadas AS piezas,
          indicaciones,
          tratamiento,
          claveconsulta,
          nombre_paciente
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE]
        WHERE nombre_paciente = @nombrePaciente
      `;
      const result = await pool.request().input("nombrePaciente", nombrePaciente).query(query);

      res.status(200).json({ ok: true, historial: result.recordset });
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ ok: false, error: "Error al obtener el historial de medicamentos" });
    }
  } else {
    res.status(405).json({ ok: false, error: "Método no permitido" });
  }
}
