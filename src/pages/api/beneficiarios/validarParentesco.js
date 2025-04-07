import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { numNomina, parentesco } = req.body;

    // Validar que los parámetros estén presentes
    if (!numNomina || !parentesco) {
      return res.status(400).json({ error: "Solicitud incorrecta: faltan parámetros." });
    }

    try {
      const pool = await connectToDatabase();

      // Validar conflicto solo para Esposo(a) (1) y Concubino(a) (3)
      if (parentesco === "1" || parentesco === "3") {
        const oppositeParentesco = parentesco === "1" ? "3" : "1";

        const conflictQuery = `
          SELECT COUNT(*) AS conflictCount
          FROM BENEFICIARIO
          WHERE NO_NOMINA = @numNomina
            AND PARENTESCO = @oppositeParentesco
            AND ACTIVO = 'A'
        `;

        const conflictResult = await pool
          .request()
          .input("numNomina", sql.VarChar, numNomina)
          .input("oppositeParentesco", sql.VarChar, oppositeParentesco)
          .query(conflictQuery);

        const conflictCount = conflictResult.recordset[0]?.conflictCount || 0;

        if (conflictCount > 0) {
          const message =
            parentesco === "1"
              ? "No puedes registrar un Esposo(a) porque ya existe un Concubino(a) activo."
              : "No puedes registrar un Concubino(a) porque ya existe un Esposo(a) activo.";

          return res.status(400).json({ conflict: true, message });
        }

        // Validar duplicados del mismo tipo (Esposo/Concubino)
        const duplicateQuery = `
          SELECT COUNT(*) AS duplicateCount
          FROM BENEFICIARIO
          WHERE NO_NOMINA = @numNomina
            AND PARENTESCO = @parentesco
            AND ACTIVO = 'A'
        `;

        const duplicateResult = await pool
          .request()
          .input("numNomina", sql.VarChar, numNomina)
          .input("parentesco", sql.VarChar, parentesco)
          .query(duplicateQuery);

        const duplicateCount = duplicateResult.recordset[0]?.duplicateCount || 0;

        if (duplicateCount >= 1) {
          const message =
            parentesco === "1"
              ? "Solo puedes tener un Esposo(a) registrado como activo."
              : "Solo puedes tener un Concubino(a) registrado como activo.";

          return res.status(400).json({ conflict: true, message });
        }
      }

      // Si no hay conflictos, devolver respuesta válida
      return res.status(200).json({ conflict: false });
    } catch (error) {
      console.error("Error al validar parentesco:", error.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }
}
