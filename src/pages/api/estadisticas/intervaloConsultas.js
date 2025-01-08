import { connectToDatabase } from "../connectToDatabase";

export const getConsultasData = async () => {
  try {
    const pool = await connectToDatabase();

    const query = `
      SELECT 
        fechaconsulta,
        especialidadinterconsulta
      FROM consultas
      WHERE especialidadinterconsulta IS NULL
    `;

    const result = await pool.request().query(query);

    const formattedData = result.recordset.map(row => {
      const fecha = new Date(row.fechaconsulta);

      // Formatear horas con ceros iniciales
      const hour = fecha.getHours().toString().padStart(2, '0');
      const day = fecha.toISOString().split('T')[0]; // Fecha en formato YYYY-MM-DD

      // Calcular semanas correctamente
      const week = `${fecha.getFullYear()}-W${Math.ceil(
        (fecha.getDate() + fecha.getDay() - 1) / 7
      )}`;

      return {
        hour: `${day} ${hour}:00`, // Fecha y hora (YYYY-MM-DD HH:00)
        day,
        week,
        month: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
        year: fecha.getFullYear(),
      };
    });

    // Agrupar datos
    const groupedData = formattedData.reduce((acc, item) => {
      const { hour, day, week, month, year } = item;
      acc.hours[hour] = (acc.hours[hour] || 0) + 1;
      acc.days[day] = (acc.days[day] || 0) + 1;
      acc.weeks[week] = (acc.weeks[week] || 0) + 1;
      acc.months[month] = (acc.months[month] || 0) + 1;
      acc.years[year] = (acc.years[year] || 0) + 1;
      return acc;
    }, { hours: {}, days: {}, weeks: {}, months: {}, years: {} });

    return groupedData;
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    throw new Error('Error al obtener los datos de la base de datos');
  }
};

export default async function handler(req, res) {
  try {
    const data = await getConsultasData(); // Llama a la función que conecta con la base de datos
    res.status(200).json(data); // Devuelve los datos en formato JSON
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
}
