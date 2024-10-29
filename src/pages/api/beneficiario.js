import { connectToDatabase } from "./connectToDatabase"; //* Importación interna en la API
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nomina } = req.body;
    console.log("Nomina recibida:", nomina); //! Log para verificar el valor

    try {
      const pool = await connectToDatabase();
      const result = await pool.request()
        .input("nomina", sql.VarChar, nomina)  // Cambiado a VarChar para manejar correctamente el tipo de dato
        .query(`
          SELECT B.NOMBRE, B.A_PATERNO, B.A_MATERNO, B.F_NACIMIENTO, P.PARENTESCO AS PARENTESCO_DESC
          FROM BENEFICIARIO B
          LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
          WHERE B.NO_NOMINA = @nomina
        `);

      if (result.recordset.length > 0) {
        res.status(200).json(result.recordset[0]);
      } else {
        res.status(404).json({ message: "Beneficiario no encontrado" });
      }
    } catch (error) {
      console.error("Error al buscar beneficiario:", error);
      res.status(500).json({ message: "Error de conexión", error });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
