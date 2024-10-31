import { connectToDatabase } from "./connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nomina } = req.body;
    console.log("Nomina recibida:", nomina);

    try {
      const pool = await connectToDatabase();
      const result = await pool.request().input("nomina", sql.VarChar, nomina)
        .query(`
          SELECT 
            B.NOMBRE, 
            B.A_PATERNO, 
            B.A_MATERNO, 
            B.F_NACIMIENTO, 
            P.ID_PARENTESCO AS ID_PARENTESCO,
            P.PARENTESCO AS PARENTESCO_DESC,
            DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()) AS YEARS,
            DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()) AS MONTHS,
            DATEDIFF(DAY, DATEADD(MONTH, DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()), DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO)), GETDATE()) AS DAYS
          FROM BENEFICIARIO B
          LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
          WHERE B.NO_NOMINA = @nomina
        `);

      if (result.recordset.length > 0) {
        //* Añade el campo EDAD en cada beneficiario
        const beneficiaries = result.recordset.map(beneficiary => ({
          ...beneficiary,
          EDAD: `${beneficiary.YEARS} años, ${beneficiary.MONTHS} meses, ${beneficiary.DAYS} días`
        }));

        console.log("Lista de beneficiarios:", beneficiaries); //! Verifica la salida
        res.status(200).json({ beneficiarios: beneficiaries });
      } else {
        res.status(404).json({ message: "No se encontraron beneficiarios para esta nómina" });
      }
    } catch (error) {
      console.error("Error al buscar beneficiarios:", error);
      res.status(500).json({ message: "Error de conexión", error });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
