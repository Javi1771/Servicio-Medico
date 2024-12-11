import { connectToDatabase } from "../connectToDatabase";
import { pusher } from "../pusher"; 
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavepaciente, clavenomina } = req.query;

  if (!clavenomina && !clavepaciente) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios: clavenomina o clavepaciente" });
  }

  try {
    const pool = await connectToDatabase();
    let query = `
      SELECT 
        d.claveconsulta,
        ISNULL(e.especialidad, 'Sin asignar') AS especialidad,
        d.prioridad,
        d.observaciones,
        d.nombre_medico,
        FORMAT(DATEADD(HOUR, -5, d.fecha_asignacion), 'yyyy-MM-dd HH:mm:ss') AS fecha_asignacion,
        d.clavepaciente
      FROM detalleEspecialidad d
      LEFT JOIN especialidades e ON d.claveespecialidad = e.claveespecialidad
      WHERE 1=1
    `;

    const inputs = [];

    // Filtro por clavenomina
    if (clavenomina) {
      query += ` AND d.clavenomina = @clavenomina`;
      inputs.push({ name: "clavenomina", type: sql.NVarChar, value: clavenomina });
    }

    // Filtro adicional por clavepaciente
    if (clavepaciente) {
      query += ` AND d.clavepaciente = @clavepaciente`;
      inputs.push({ name: "clavepaciente", type: sql.NVarChar, value: clavepaciente });
    }

    query += ` ORDER BY d.fecha_asignacion DESC`;

    console.log("Consulta SQL ejecutada:", query);

    const request = pool.request();
    inputs.forEach((input) => {
      request.input(input.name, input.type, input.value);
    });

    const result = await request.query(query);

    const historial = result.recordset;

    //* Emitiendo evento Pusher
    await pusher.trigger("especialidades-channel", "especialidades-updated", {
      clavepaciente,
      historial,
    });

    return res.status(200).json({ historial });
  } catch (error) {
    console.error("Error al obtener historial de especialidades:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener historial.", error: error.message });
  }
}
