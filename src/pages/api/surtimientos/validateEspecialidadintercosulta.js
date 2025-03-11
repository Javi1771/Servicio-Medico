import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveconsulta } = req.query;

  if (!claveconsulta) {
    return res
      .status(400)
      .json({ message: "La clave de consulta es requerida." });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta SQL para verificar el campo especialidadinterconsulta
    const query = `
      SELECT especialidadinterconsulta
      FROM consultas
      WHERE claveconsulta = @claveconsulta
    `;

    const result = await pool
      .request()
      .input("claveconsulta", claveconsulta)
      .query(query);

    const especialidad = result.recordset[0]?.especialidadinterconsulta;

    // Verificar si especialidadinterconsulta es un número válido
    const habilitado = especialidad !== null && especialidad > 0;

    res.status(200).json({ habilitado });
  } catch (error) {
    console.error("Error en la validación:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
