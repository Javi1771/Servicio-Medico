import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { id, medicamento, clasificacion, presentacion, ean, piezas } = req.body;

    //* 🔴 Verificar si algún valor es `undefined` o `null`
    if (id == null || medicamento == null || clasificacion == null || presentacion == null || ean == null || piezas == null) {
      console.error("Faltan campos obligatorios:", { id, medicamento, clasificacion, presentacion, ean, piezas });
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
      //* 🔵 Log para verificar datos enviados antes de ejecutar la consulta
      console.log("Iniciando actualización del medicamento con los siguientes datos:", { id, medicamento, clasificacion, presentacion, ean, piezas });

      const pool = await connectToDatabase();
      const query = `
        UPDATE MEDICAMENTOS
        SET medicamento = @medicamento, 
            clasificacion = @clasificacion, 
            presentacion = @presentacion, 
            ean = @ean, 
            piezas = @piezas
        WHERE claveMedicamento = @id
      `;

      //* CORREGIDO: Se debe declarar "id" y NO "claveMedicamento"
      const request = pool.request();
      request.input("id", sql.Int, id);
      request.input("medicamento", sql.VarChar, medicamento);
      request.input("clasificacion", sql.NVarChar(1), clasificacion);
      request.input("presentacion", sql.Int, presentacion);
      request.input("ean", sql.BigInt, ean);
      request.input("piezas", sql.Int, piezas);

      console.log("Ejecutando query de actualización:", query);
      const result = await request.query(query);
      console.log("Resultado de la actualización:", result);

      if (result.rowsAffected[0] > 0) {
        console.log("✅ Medicamento actualizado correctamente, ID:", id);
        res.status(200).json({ message: "Medicamento editado correctamente." });
      } else {
        console.warn("⚠️ No se encontró medicamento con el ID:", id);
        res.status(404).json({ message: "Medicamento no encontrado." });
      }
    } catch (error) {
      console.error("❌ Error al editar medicamento:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
