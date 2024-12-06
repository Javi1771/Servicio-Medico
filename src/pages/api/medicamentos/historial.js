import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { nombrePaciente } = req.query;

    if (!nombrePaciente) {
      return res
        .status(400)
        .json({ ok: false, error: "El nombre del paciente es obligatorio" });
    }

    try {
      const pool = await connectToDatabase();

      //* Obtener la fecha actual menos un mes
      const today = new Date();
      const oneMonthAgo = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        today.getDate()
      );

      //* Consulta principal para medicamentos y datos de consulta
      const queryMedicamentos = `
        SELECT 
          mp.fecha_otorgacion AS fecha,
          mp.sustancia AS medicamento,
          mp.piezas_otorgadas AS piezas,
          mp.indicaciones,
          mp.tratamiento,
          mp.clave_nomina AS clavenomina,
          mp.claveconsulta,
          mp.nombre_paciente,
          mp.id_especialidad AS claveespecialidad,
          mp.nombre_medico,
          c.diagnostico,
          c.motivoconsulta
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTO_PACIENTE] mp
        LEFT JOIN [PRESIDENCIA].[dbo].[consultas] c
        ON mp.claveconsulta = c.claveconsulta
        WHERE mp.nombre_paciente = @nombrePaciente
          AND mp.fecha_otorgacion >= @oneMonthAgo
        ORDER BY mp.fecha_otorgacion DESC
      `;

      const medicamentosResult = await pool
        .request()
        .input("nombrePaciente", nombrePaciente)
        .input("oneMonthAgo", sql.DateTime, oneMonthAgo)
        .query(queryMedicamentos);

      const medicamentos = medicamentosResult.recordset;

      if (medicamentos.length === 0) {
        return res.status(200).json({ ok: true, historial: [] });
      }

      //* Extraer IDs únicos de claveespecialidad
      const especialidadIds = [
        ...new Set(
          medicamentos
            .map((med) => med.claveespecialidad)
            .filter((id) => id !== null)
        ),
      ];

      //* Consulta de especialidades
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

        //* Crear un mapa para las especialidades
        especialidadesMap = especialidades.reduce((acc, esp) => {
          acc[esp.id_especialidad] = esp.nombre_especialidad;
          return acc;
        }, {});
      }

      //* Combinar historial con nombres de especialidades
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
