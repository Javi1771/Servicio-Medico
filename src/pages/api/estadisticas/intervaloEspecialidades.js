import { connectToDatabase } from "../connectToDatabase";

//* Esta función obtiene los datos de la tabla "consultas",
//* pero ahora considera SOLO los registros donde especialidadinterconsulta
//! NO sea null, y hace JOIN con "especialidades" para traer la columna "especialidad".
export const getConsultasData = async () => {
  try {
    const pool = await connectToDatabase();

    //? Nueva consulta: 
    //* - INNER JOIN con "especialidades" usando la columna "especialidadinterconsulta" 
    //   que coincida con "claveespecialidad".
    //* - Se filtra por clavestatus=2
    //* - Se excluyen registros donde 'especialidadinterconsulta' sea NULL
    //   (es decir, solo se toman los que sí tengan un ID en esa columna).
    const query = `
      SELECT
        c.fechaconsulta,
        c.claveconsulta,
        e.especialidad
      FROM consultas c
      INNER JOIN especialidades e
        ON c.especialidadinterconsulta = e.claveespecialidad
      WHERE c.clavestatus = 2
        AND c.especialidadinterconsulta IS NOT NULL
    `;

    //console.log("Ejecutando consulta SQL...");
    const result = await pool.request().query(query);

    //* Convertimos las fechas
    const fechasRaw = result.recordset
      .filter((row) => row.fechaconsulta)
      .map((row) => new Date(row.fechaconsulta));

    if (fechasRaw.length === 0) {
      //console.log("No se encontraron fechas.");
      return {
        hours: {},
        days: {},
        months: {},
        years: {},
      };
    }

    //* Inicializamos agrupaciones
    const horasAgrupadas = {};
    const diasAgrupados = {};
    const mesesAgrupados = {};
    const añosAgrupados = {};

    //* Agrupamos los datos por fecha/hora
    fechasRaw.forEach((fecha) => {
      const localFecha = new Date(fecha);

      //* Formato de hora exacta: YYYY-MM-DD HH:00
      const roundedHour = new Date(
        localFecha.getFullYear(),
        localFecha.getMonth(),
        localFecha.getDate(),
        localFecha.getHours(),
        0,
        0,
        0
      );
      const hourKey = roundedHour.toISOString().replace("T", " ").substring(0, 16);

      //* Formato día: YYYY-MM-DD
      const dayKey = localFecha.toISOString().split("T")[0];

      //* Formato mes: YYYY-MM
      const monthKey = `${localFecha.getFullYear()}-${String(
        localFecha.getMonth() + 1
      ).padStart(2, "0")}`;

      //* Formato año: YYYY
      const yearKey = `${localFecha.getFullYear()}`;

      //* Incrementamos los contadores
      horasAgrupadas[hourKey] = (horasAgrupadas[hourKey] || 0) + 1;
      diasAgrupados[dayKey] = (diasAgrupados[dayKey] || 0) + 1;
      mesesAgrupados[monthKey] = (mesesAgrupados[monthKey] || 0) + 1;
      añosAgrupados[yearKey] = (añosAgrupados[yearKey] || 0) + 1;
    });

    return {
      hours: horasAgrupadas,
      days: diasAgrupados,
      months: mesesAgrupados,
      years: añosAgrupados,
      //* keys, por si se usan en otro lado
      keys: fechasRaw.map((fecha) => fecha.toISOString()),
    };
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    throw new Error("Error al obtener los datos de la base de datos");
  }
};

export default async function handler(req, res) {
  try {
    //console.log("Recibiendo solicitud en el handler...");

    const data = await getConsultasData();

    const { interval, dia } = req.query;

    //* Se mantiene la lógica para filtrar si 'interval === "horas"' y hay 'dia'
    if (interval === "horas" && dia) {
      const filteredData = Object.keys(data.hours).reduce((acc, key) => {
        if (key.startsWith(dia)) {
          acc[key] = data.hours[key];
        }
        return acc;
      }, {});

      //console.log(`\n=== Datos filtrados para horas en ${dia} ===`);
      //console.log(filteredData);

      res.status(200).json({ hours: filteredData });
    }
    //* En caso de interval="días"
    else if (interval === "días") {
      //console.log("\n=== Datos por días ===");
      //console.log(data.days);
      res.status(200).json({ days: data.days });
    }
    //* En caso de interval="meses"
    else if (interval === "meses") {
      //console.log("\n=== Datos por meses ===");
      //console.log(data.months);
      res.status(200).json({ months: data.months });
    }
    //* En caso de interval="años"
    else if (interval === "años") {
      //console.log("\n=== Datos por años ===");
      //console.log(data.years);
      res.status(200).json({ years: data.years });
    }
    //* En cualquier otro caso, enviamos todo
    else {
      res.status(200).json(data);
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
}
