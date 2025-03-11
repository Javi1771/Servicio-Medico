import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido." });
  }

  const { idDetalleReceta, estatus } = req.body;

  if (!idDetalleReceta || estatus === undefined) {
    return res.status(400).json({ message: "Datos incompletos. Verifica la solicitud." });
  }

  try {
    const pool = await connectToDatabase();

    const query = `
      UPDATE detalleReceta
      SET estatus = @estatus
      WHERE idDetalleReceta = @idDetalleReceta
    `;

    await pool
      .request()
      .input("idDetalleReceta", idDetalleReceta)
      .input("estatus", estatus)
      .query(query);

    return res.status(200).json({ message: "Estatus actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar el estatus:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
