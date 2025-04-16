import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.timeout = 0; //! Deshabilitar timeout

    const query = `
      SELECT claveEstudio,
             estudio,
             estatus
      FROM ESTUDIOS
      WHERE estatus = 1
      ORDER BY estudio ASC
    `;

    const result = await request.query(query);
    //console.log("Resultados de la consulta:", result.recordset);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al realizar la consulta de estudios:", error);
    res
      .status(500)
      .json({ message: "Error al realizar la consulta", error: error.message });
  }
}
