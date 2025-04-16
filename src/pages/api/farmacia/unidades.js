import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      //console.log("Conectando a la base de datos para obtener unidades de medida");
      const pool = await connectToDatabase();
      const query = `
        SELECT [id_medida], [medida]
        FROM [dbo].[unidades_de_medida]
      `;
      //console.log("Ejecutando query:", query);
      const result = await pool.request().query(query);
      //console.log("Resultado de la consulta:", result);

      const unidades = result.recordset.map((row) => ({
        code: row.id_medida,
        label: row.medida,
      }));

      res.status(200).json(unidades);
    } catch (error) {
      console.error("Error en /api/farmacia/unidades:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
