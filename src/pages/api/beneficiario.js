import { connectToDatabase } from "./connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nomina } = req.body;
    console.log("Nomina recibida:", nomina);

    try {
      const pool = await connectToDatabase();
      const result = await pool.request()
        .input("nomina", sql.VarChar, nomina)
        .query(`
          SELECT 
            B.NOMBRE, 
            B.A_PATERNO, 
            B.A_MATERNO, 
            B.F_NACIMIENTO, 
            P.PARENTESCO AS PARENTESCO_DESC,
            DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()) AS YEARS,
            DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()) AS MONTHS,
            DATEDIFF(DAY, DATEADD(MONTH, DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()), DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO)), GETDATE()) AS DAYS
          FROM BENEFICIARIO B
          LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
          WHERE B.NO_NOMINA = @nomina
        `);

      if (result.recordset.length > 0) {
        const beneficiaryData = result.recordset[0];
        //* Combina los años, meses y días en un solo campo para mayor facilidad en el frontend
        beneficiaryData.EDAD = `${beneficiaryData.YEARS} años, ${beneficiaryData.MONTHS} meses, ${beneficiaryData.DAYS} días`;
        
        console.log("Datos del beneficiario con edad:", beneficiaryData); //* Verificar salida
        res.status(200).json(beneficiaryData);
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
