import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { id, medicamento, clasificación, presentación, ean, piezas } = req.body;

    if (!id || !medicamento || clasificación == null || presentación == null || ean == null || piezas == null) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        UPDATE MEDICAMENTOS_NEW
        SET medicamento = @medicamento, clasificación = @clasificación, presentación = @presentación, ean = @ean, piezas = @piezas
        WHERE claveMedicamento = @id
      `;
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("medicamento", sql.VarChar, medicamento)
        .input("clasificación", sql.NVarChar(1), clasificación)
        .input("presentación", sql.Int, presentación)
        .input("ean", sql.BigInt, ean)
        .input("piezas", sql.Int, piezas)
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
