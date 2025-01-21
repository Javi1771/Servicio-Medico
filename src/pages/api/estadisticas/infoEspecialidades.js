import { connectToDatabase } from "../connectToDatabase";

export const getDetallesConsultas = async (fechaHoraInicio, fechaHoraFin) => {
  try {
    const pool = await connectToDatabase();

    //* Nueva consulta:
    // - Se agrega LEFT JOIN con tabla "especialidades" para traer la columna "especialidad".
    // - Se filtra por c.especialidadinterconsulta IS NOT NULL y c.clavestatus=2.
    // - Se omiten las consultas que no tengan un id de especialidad.
    const query = `
      SELECT
        c.fechaconsulta,
        c.claveconsulta,
        c.clavenomina,
        c.motivoconsulta,
        c.diagnostico,
        c.nombrepaciente,
        c.edad,
        CASE
          WHEN TRY_CAST(c.parentesco AS INT) IS NOT NULL THEN p.parentesco
          ELSE c.parentesco
        END AS parentesco,
        c.departamento,
        c.costo,
        c.sindicato,
        c.claveproveedor,
        c.fechacita,
        pr.nombreproveedor,
        e.especialidad
      FROM consultas AS c
      LEFT JOIN PARENTESCO AS p 
        ON TRY_CAST(c.parentesco AS INT) = p.ID_PARENTESCO
      LEFT JOIN proveedores AS pr 
        ON c.claveproveedor = pr.claveproveedor
      LEFT JOIN especialidades AS e
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.especialidadinterconsulta IS NOT NULL
        AND c.clavestatus = 2
        AND c.fechaconsulta >= @fechaHoraInicio
        AND c.fechaconsulta <= @fechaHoraFin
      ORDER BY c.fechaconsulta ASC;
    `;

    console.log("Ejecutando consulta con parámetros:", {
      fechaHoraInicio,
      fechaHoraFin,
    });

    const result = await pool
      .request()
      .input("fechaHoraInicio", fechaHoraInicio)
      .input("fechaHoraFin", fechaHoraFin)
      .query(query);

    return result.recordset;
  } catch (error) {
    console.error("Error al obtener los detalles de las consultas:", error);
    throw new Error("Error al obtener los detalles de las consultas");
  }
};

export default async function handler(req, res) {
  const { start, end } = req.query;

  if (!start || !end) {
    res.status(400).json({ error: "Faltan parámetros de inicio o fin de fecha" });
    return;
  }

  try {
    //* Se usan las fechas directamente sin convertir a UTC
    console.log(`Obteniendo detalles de consultas entre ${start} y ${end}`);

    const detalles = await getDetallesConsultas(start, end);

    console.log("Cantidad de registros obtenidos:", detalles.length);

    res.status(200).json({ detalles });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error al obtener los detalles de las consultas" });
  }
}
