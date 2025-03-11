import { connectToDatabase } from "../../api/connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveProveedor } = req.query;

  if (!claveProveedor) {
    return res.status(400).json({ message: "La clave del proveedor es obligatoria." });
  }

  try {
    const pool = await connectToDatabase();
    const query = `
      SELECT nombreusuario, claveespecialidad
      FROM USUARIOS
      WHERE claveusuario = @claveProveedor
    `;

    const result = await pool
      .request()
      .input("claveProveedor", sql.Int, claveProveedor)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Especialista no encontrado." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener el especialista:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
