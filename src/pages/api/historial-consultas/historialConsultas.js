import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  //console.log("Solicitud recibida en la ruta:", req.url);
  //console.log("Parámetros recibidos:", req.query);

  const { clavepaciente, clavenomina } = req.query;

  if (!clavenomina || !clavepaciente) {
    console.error(
      "Error: Ambos parámetros clavenomina y clavepaciente son obligatorios."
    );
    return res.status(400).json({
      message:
        "Debe proporcionar los parámetros clavenomina y clavepaciente obligatoriamente.",
    });
  }

  try {
    const pool = await connectToDatabase();

    //TODO: Modificar la consulta SQL para obtener el historial de consultas (con especialidad de interconsulta)
    const query = `
      SELECT 
        c.fechaconsulta,
        c.nombrepaciente,
        c.motivoconsulta,
        c.diagnostico,
        c.claveconsulta,
        c.seasignoaespecialidad,
        e.especialidad AS especialidadinterconsulta,
        c.clavepaciente
      FROM consultas AS c
      LEFT JOIN especialidades AS e 
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.clavenomina = @clavenomina
        AND c.clavepaciente = @clavepaciente
        AND c.clavestatus = 2
        AND c.diagnostico IS NOT NULL
        AND c.motivoconsulta IS NOT NULL
      ORDER BY c.fechaconsulta DESC
    `;

    //console.log("Consulta SQL ejecutada:", query);

    const result = await pool
      .request()
      .input("clavenomina", sql.NVarChar, clavenomina)
      .input("clavepaciente", sql.NVarChar, clavepaciente)
      .query(query);

    const consultas = result.recordset;

    //* Formatear fechas para el frontend
    const consultasFormateadas = consultas.map((consulta) => ({
      ...consulta,
      fechaconsulta: consulta.fechaconsulta
        ? consulta.fechaconsulta.toISOString()
        : null,
    }));

    //console.log("Consultas formateadas para el frontend:", consultasFormateadas);

    res.status(200).json(consultasFormateadas);
  } catch (error) {
    console.error("Error al realizar la consulta:", error);
    res
      .status(500)
      .json({ message: "Error al realizar la consulta", error: error.message });
  }
}
