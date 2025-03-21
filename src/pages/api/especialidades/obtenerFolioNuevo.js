import { connectToDatabase } from "../connectToDatabase";

//* Función para obtener el nombre del día en español */
function getDiaSemana(dia) {
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return diasSemana[dia];
}

//* Función para formatear la fecha respetando la hora original */
function formatFecha(fecha) {
  const date = new Date(fecha);
  const diaSemana = getDiaSemana(date.getUTCDay());
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0"); //* Los meses empiezan en 0
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    //* Conectar a la base de datos
    const pool = await connectToDatabase();

    //* Consulta SQL sin filtrar por claveproveedor
    const query = `
      SELECT 
        c.fechacita,
        c.clavenomina,
        c.nombrepaciente,
        c.claveproveedor, 
        c.sindicato,
        c.claveconsulta,
        p.nombreproveedor AS nombreProveedor,
        c.claveusuario,
        pu.nombreproveedor AS nombreUsuarioProveedor,
        pu.claveespecialidad AS claveEspecialidadUsuario,
        esp.especialidad AS nombreEspecialidadUsuario,
        e.especialidad, 
        c.especialidadinterconsulta,
        c.diagnostico  
      FROM consultas c
      INNER JOIN especialidades e ON c.especialidadinterconsulta = e.claveespecialidad
      INNER JOIN proveedores p ON c.claveproveedor = p.claveproveedor
      LEFT JOIN proveedores pu ON c.claveusuario = pu.claveproveedor
      LEFT JOIN especialidades esp ON pu.claveespecialidad = esp.claveespecialidad
      WHERE c.especialidadinterconsulta IS NOT NULL
        AND e.estatus = 1
        AND CAST(c.fechacita AS DATE) >= CAST(GETDATE() AS DATE)
      ORDER BY c.fechacita DESC;
    `;

    //* Ejecutar la consulta
    const result = await pool.request().query(query);

    //* Procesar y formatear resultados
    const formattedResults = result.recordset.map((record) => {
      const formattedDate = formatFecha(record.fechacita);
      return {
        ...record,
        fechacita: formattedDate,
        atendido: !!record.diagnostico, //* Booleano: true si hay diagnóstico
        estadoPaciente: record.diagnostico
          ? "Paciente Atendido"
          : "Paciente No Atendido"
      };
    });

    //! Desactivar caché en la respuesta
    res.setHeader("Cache-Control", "no-store");

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Error al consultar los datos:", error);
    res.status(500).json({ error: "Error al consultar los datos." });
  }
}
