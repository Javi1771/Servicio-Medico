import { connectToDatabase } from "../connectToDatabase"; // Ajusta la ruta de conexión

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveconsulta, diagnostico } = req.body;

  if (!claveconsulta || !diagnostico) {
    return res
      .status(400)
      .json({ message: "Clave de consulta y diagnóstico son requeridos." });
  }

  try {
    const pool = await connectToDatabase();

    // Actualizar el campo diagnostico en la tabla CONSULTAS
    const query = `
      UPDATE consultas
      SET diagnostico = @diagnostico
      WHERE claveconsulta = @claveconsulta
    `;

    await pool
      .request()
      .input("claveconsulta", claveconsulta)
      .input("diagnostico", diagnostico)
      .query(query);

    res
      .status(200)
      .json({ message: "Diagnóstico actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar diagnóstico:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
