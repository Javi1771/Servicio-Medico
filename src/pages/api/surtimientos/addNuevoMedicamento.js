import { connectToDatabase } from "../connectToDatabase"; // Ajusta la ruta según tu estructura

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nombre, tipo } = req.body;

    // Validar los datos de entrada
    if (!nombre || !tipo) {
      return res
        .status(400)
        .json({ message: "El nombre y el tipo son obligatorios." });
    }

    try {
      const pool = await connectToDatabase();

      // Obtener el valor máximo de CLAVEMEDICAMENTO y sumar 1
      const resultClave = await pool
        .request()
        .query(`SELECT ISNULL(MAX(CAST(claveMedicamento AS INT)), 0) + 1 AS NuevoClave FROM MEDICAMENTOS`);

      const nuevoClave = resultClave.recordset[0].NuevoClave;

      // Insertar el nuevo medicamento
      const insertResult = await pool
        .request()
        .input("claveMedicamento", nuevoClave.toString())
        .input("medicamento", nombre)
        .input("clasificacion", tipo)
        .query(`
          INSERT INTO MEDICAMENTOS (claveMedicamento, medicamento, clasificacion)
          VALUES (@claveMedicamento, @medicamento, @clasificacion)
        `);

      if (insertResult.rowsAffected[0] > 0) {
        return res
          .status(201)
          .json({ message: "Medicamento registrado con éxito." });
      } else {
        return res
          .status(500)
          .json({ message: "Error interno: No se pudo insertar el medicamento." });
      }
    } catch (error) {
      console.error("Error al insertar medicamento:", error);
      return res.status(500).json({ message: "Error en el servidor." });
    }
  } else {
    return res.status(405).json({ message: "Método no permitido." });
  }
}
