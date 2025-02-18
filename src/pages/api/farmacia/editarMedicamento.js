import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { claveMedicamento, medicamento, clasificación, presentación, ean, piezas } = req.body;

    if (!claveMedicamento || !medicamento || clasificación == null || presentación == null || ean == null || piezas == null) {
      console.error("Faltan campos obligatorios:", { claveMedicamento, medicamento, clasificación, presentación, ean, piezas });
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
      // Log de los datos que se van a actualizar
      console.log("Iniciando actualización del medicamento con los siguientes datos:", { claveMedicamento, medicamento, clasificación, presentación, ean, piezas });

      const pool = await connectToDatabase();
      const query = `
        UPDATE MEDICAMENTOS_NEW
        SET medicamento = @medicamento, clasificación = @clasificación, presentación = @presentación, ean = @ean, piezas = @piezas
        WHERE claveMedicamento = @claveMedicamento
      `;

      // Preparar y ejecutar la consulta
      const request = pool.request();
      request.input("claveMedicamento", sql.Int, claveMedicamento);
      request.input("medicamento", sql.VarChar, medicamento);
      request.input("clasificación", sql.NVarChar(1), clasificación);
      request.input("presentación", sql.Int, presentación);
      request.input("ean", sql.BigInt, ean);
      request.input("piezas", sql.Int, piezas);

      console.log("Ejecutando query de actualización:", query);
      const result = await request.query(query);
      console.log("Resultado de la actualización:", result);

      if (result.rowsAffected[0] > 0) {
        console.log("Medicamento actualizado correctamente, ID:", id);
        res.status(200).json({ message: "Medicamento editado correctamente." });
      } else {
        console.warn("No se encontró medicamento con el ID:", id);
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
