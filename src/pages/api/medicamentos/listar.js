import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();

      //! Usar solo las columnas necesarias para la consulta
      const query = `
        SELECT claveMedicamento AS CLAVEMEDICAMENTO, medicamento AS MEDICAMENTO
        FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS_NEW] WITH (NOLOCK)
        WHERE estatus = 1
        ORDER BY MEDICAMENTO ASC
      `;

      //? Ejecutar la consulta directamente y deshabilitar bloqueos (opcional)
      const result = await pool.request().query(query);

      //* Convertir el resultado en un array para una respuesta más eficiente
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error al obtener medicamentos:", error);
      res.status(500).json({ error: "Error al obtener medicamentos" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
