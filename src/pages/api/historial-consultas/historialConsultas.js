import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  console.log("Solicitud recibida en la ruta:", req.url);
  console.log("Parámetros recibidos:", req.query);

  const { clavepaciente, clavenomina } = req.query;

  if (!clavenomina && !clavepaciente) {
    console.error("Error: Faltan los parámetros clavenomina y clavepaciente.");
    return res.status(400).json({
      message: "Debe proporcionar al menos clavenomina o clavepaciente.",
    });
  }

  try {
    const pool = await connectToDatabase();
    let consultas = [];

    // Filtro por clavenomina
    if (clavenomina) {
      const queryNomina = `
        SELECT 
          c.fechaconsulta,
          c.nombrepaciente,
          c.motivoconsulta,
          c.diagnostico,
          c.seasignoaespecialidad,
          e.especialidad AS especialidadinterconsulta,
          c.clavepaciente
        FROM consultas AS c
        LEFT JOIN especialidades AS e 
          ON c.especialidadinterconsulta = e.claveespecialidad
        WHERE c.clavenomina = @clavenomina
        ORDER BY c.fechaconsulta DESC
      `;

      console.log("Ejecutando consulta por clavenomina:", queryNomina);

      const resultNomina = await pool
        .request()
        .input("clavenomina", sql.NVarChar, clavenomina)
        .query(queryNomina);

      consultas = resultNomina.recordset;
      console.log("Resultados por clavenomina:", consultas);
    }

    // Filtro adicional por clavepaciente
    if (clavepaciente) {
      consultas = consultas.filter(
        (consulta) => consulta.clavepaciente === clavepaciente
      );

      console.log(
        "Resultados filtrados por clavepaciente:",
        consultas
      );
    }

    // Formatear fechas para el frontend
    const consultasFormateadas = consultas.map((consulta) => ({
      ...consulta,
      fechaconsulta: consulta.fechaconsulta
        ? consulta.fechaconsulta.toISOString()
        : null,
    }));

    console.log("Consultas formateadas para el frontend:", consultasFormateadas);

    res.status(200).json(consultasFormateadas);
  } catch (error) {
    console.error("Error al realizar la consulta:", error);
    res.status(500).json({ message: "Error al realizar la consulta", error });
  }
}
