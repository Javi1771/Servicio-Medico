import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { numNomina, parentesco } = req.body;

    try {
      const pool = await connectToDatabase();

      // Solo validar Padre (4) o Madre (5)
      if (["4", "5"].includes(parentesco)) {
        const query = `
          SELECT COUNT(*) AS conflictCount
          FROM BENEFICIARIO
          WHERE NO_NOMINA = @numNomina
            AND PARENTESCO = @parentesco
            AND ACTIVO = 'A'
        `;

        const result = await pool
          .request()
          .input("numNomina", sql.VarChar, numNomina)
          .input("parentesco", sql.VarChar, parentesco)
          .query(query);

        const conflictCount = result.recordset[0]?.conflictCount || 0;

        if (conflictCount > 0) {
          const parentescoNombre =
            parentesco === "4"
              ? "Padre"
              : parentesco === "5"
              ? "Madre"
              : "Registro duplicado";

          return res
            .status(400)
            .json({
              conflict: true,
              message: `No puedes registrar otro ${parentescoNombre} porque ya existe uno activo.`,
            });
        }
      }

      // Si no es Padre/Madre, permitir el registro
      res.status(200).json({ conflict: false });
    } catch (error) {
      console.error("Error al validar parentesco único:", error.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
