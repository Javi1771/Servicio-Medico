import sql from "mssql";
import { connectToDatabase } from "./connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario } = req.query;

  if (!usuario) {
    return res.status(400).json({ message: "Usuario no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();
    await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query("UPDATE usuarios SET activo = 'N' WHERE usuario = @usuario");

    res.status(200).json({ message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error al desactivar el usuario:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
}
