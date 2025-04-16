import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  if (!fecha) return ""; // Manejo básico si no existe la fecha

  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  //* Obtener los valores en UTC para preservar la hora exacta de la base de datos
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { claveconsulta } = req.query;

    if (!claveconsulta) {
      //console.log("Falta la claveconsulta en la petición.");
      return res
        .status(400)
        .json({ message: "Falta la claveconsulta en la petición." });
    }

    try {
      const pool = await connectToDatabase();

      //* Seleccionamos explícitamente las columnas de la tabla "costos" (excluyendo costo y factura)
      const query = `
        SELECT 
          c.id_gasto,
          c.claveproveedor,
          c.fecha,
          c.clavenomina,
          c.iddocumento,
          COALESCE(c.costo, 0) as costo,
          COALESCE(c.factura, '') as factura,
          c.clavepaciente,
          c.elpacienteesempleado,
          c.id_cuentacontable,
          c.estatus,
          c.departamento,
          c.especialidadinterconsulta,
          c.claveconsulta,
          p.nombreproveedor,
          e.especialidad,
          con.nombrepaciente,
          con.motivoconsulta,
          con.diagnostico,
          con.fechaconsulta,
          con.edad,
          c.url_factura,
          CASE 
            WHEN c.elpacienteesempleado = 'S' THEN 'Empleado'
            WHEN c.elpacienteesempleado = 'N' THEN par.PARENTESCO
            ELSE c.elpacienteesempleado
          END AS pacienteInfo
        FROM costos c
        LEFT JOIN proveedores p 
          ON c.claveproveedor = p.claveproveedor
        LEFT JOIN especialidades e 
          ON c.especialidadinterconsulta = e.claveespecialidad
        LEFT JOIN consultas con
          ON c.claveconsulta = con.claveconsulta
        LEFT JOIN PARENTESCO par
          ON con.parentesco = par.ID_PARENTESCO
        WHERE c.claveconsulta = @claveconsulta
      `;

      const result = await pool
        .request()
        .input("claveconsulta", sql.Int, Number(claveconsulta))
        .query(query);

      if (result.recordset.length === 0) {
        //console.log( "No se encontró ningún registro para la claveconsulta proporcionada:", claveconsulta );
        return res
          .status(404)
          .json({
            message:
              "No se encontró ningún registro para la claveconsulta proporcionada.",
          });
      }

      // * Formatear la fecha "fechaconsulta" para cada fila
      for (const row of result.recordset) {
        if (row.fechaconsulta) {
          row.fechaconsulta = formatFecha(row.fechaconsulta);
        }
      }

      // * Log para ver qué datos se enviarán al front
      //console.log( "Datos enviados al front:", JSON.stringify(result.recordset, null, 2) );

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      res.status(500).json({ message: "Error al obtener los datos." });
    }
  } else {
    console.log("Método no permitido:", req.method);
    res.status(405).json({ message: "Método no permitido." });
  }
}
