import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { clavepaciente, clavenomina } = req.query;

    if (!clavenomina && !clavepaciente) {
      return res.status(400).json({
        ok: false,
        error: "Debe proporcionar clavenomina o clavepaciente.",
      });
    }

    try {
      const pool = await connectToDatabase();

      let query = `
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
          mp.nombre_medico,
          c.diagnostico,
          c.motivoconsulta
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] mp
        LEFT JOIN [PRESIDENCIA].[dbo].[consultas] c
          ON mp.claveconsulta = c.claveconsulta
        WHERE mp.clave_nomina = @clavenomina
      `;

      if (clavepaciente) {
        query += ` AND mp.clavepaciente = @clavepaciente`;
      }

      query += ` ORDER BY mp.fecha_otorgacion DESC`;

      const request = pool.request();
      request.input("clavenomina", sql.NVarChar, clavenomina);
      if (clavepaciente) {
        request.input("clavepaciente", sql.NVarChar, clavepaciente);
      }

      const medicamentosResult = await request.query(query);
      const medicamentos = medicamentosResult.recordset;

      console.log("Resultados combinados:", medicamentos);

      if (medicamentos.length === 0) {
        return res.status(200).json({ ok: true, historial: [] });
      }

      // Obtener IDs únicos de especialidad
      const especialidadIds = [
        ...new Set(
          medicamentos
            .map((med) => med.claveespecialidad)
            .filter((id) => id !== null)
        ),
      ];

      // Consulta de especialidades
      let especialidadesMap = {};
      if (especialidadIds.length > 0) {
        const queryEspecialidades = `
          SELECT 
            claveespecialidad AS id_especialidad, 
            especialidad AS nombre_especialidad
          FROM [PRESIDENCIA].[dbo].[especialidades]
          WHERE claveespecialidad IN (${especialidadIds.join(",")})
        `;

        const especialidadesResult = await pool.request().query(queryEspecialidades);
        const especialidades = especialidadesResult.recordset;

        // Crear un mapa para las especialidades
        especialidadesMap = especialidades.reduce((acc, esp) => {
          acc[esp.id_especialidad] = esp.nombre_especialidad;
          return acc;
        }, {});
      }

      // Combinar historial con nombres de especialidades
      const historialConEspecialidad = medicamentos.map((med) => ({
        ...med,
        nombre_especialidad: especialidadesMap[med.claveespecialidad] || "No asignado",
      }));

      res.status(200).json({ ok: true, historial: historialConEspecialidad });
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({
        ok: false,
        error: "Error al obtener el historial de medicamentos",
      });
    }
  } else {
    res.status(405).json({ ok: false, error: "Método no permitido" });
  }
}
