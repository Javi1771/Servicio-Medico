import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { id, ean, sustancia, piezas, activo } = req.body;

    if (!id || !ean || !sustancia || piezas == null || activo == null) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        UPDATE MEDICAMENTOS_FARMACIA
        SET ean = @ean, sustancia = @sustancia, piezas = @piezas, activo = @activo
        WHERE ID_MEDICAMENTO = @id
      `;
      const result = await pool
        .request()
        .input("id", id)
        .input("ean", ean)
        .input("sustancia", sustancia)
        .input("piezas", piezas)
        .input("activo", activo)
        .query(query);

      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ message: "Medicamento editado correctamente." });
      } else {
        res.status(404).json({ message: "Medicamento no encontrado." });
      }
    } catch (error) {
      console.error("Error al editar medicamento:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
