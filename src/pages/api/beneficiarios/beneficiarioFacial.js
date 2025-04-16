import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nomina, ID_BENEFICIARIO } = req.body;
    //console.log("Datos recibidos - Nómina:", nomina, "ID Beneficiario:", ID_BENEFICIARIO);

    try {
      const pool = await connectToDatabase();
      const result = await pool
        .request()
        .input("nomina", sql.VarChar, nomina)
        .input("ID_BENEFICIARIO", sql.Int, ID_BENEFICIARIO)
        .query(`
          SELECT 
            B.ID_BENEFICIARIO, 
            B.NOMBRE, 
            B.A_PATERNO, 
            B.A_MATERNO, 
            B.F_NACIMIENTO, 
            B.ESDISCAPACITADO,
            B.ESESTUDIANTE,
            B.FOTO_URL,
            FORMAT(B.VIGENCIA_ESTUDIOS, 'yyyy-MM-dd') AS VIGENCIA_ESTUDIOS, 
            B.ACTIVO,
            P.ID_PARENTESCO AS ID_PARENTESCO,
            P.PARENTESCO AS PARENTESCO_DESC,
            DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()) AS YEARS,
            DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()) AS MONTHS
          FROM BENEFICIARIO B
          LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
          WHERE B.NO_NOMINA = @nomina AND B.ID_BENEFICIARIO = @ID_BENEFICIARIO
            AND B.ACTIVO = 'A'
        `);

      //console.log("Resultados de la consulta:", result.recordset);

      if (result.recordset.length > 0) {
        const beneficiaries = result.recordset.map((beneficiary) => {
          const fechaNacimiento = new Date(beneficiary.F_NACIMIENTO);
          const today = new Date();
          
          let years = beneficiary.YEARS;
          let months = beneficiary.MONTHS;
          let days = today.getDate() - fechaNacimiento.getDate();
          
          if (days < 0) {
            months -= 1;
            const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += lastMonth.getDate();
          }

          if (months < 0) {
            years -= 1;
            months += 12;
          }

          return {
            ...beneficiary,
            YEARS: years,
            MONTHS: months,
            DAYS: days,
            EDAD: `${years} años, ${months} meses, ${days} días`,
          };
        });

        //console.log("Lista de beneficiarios procesados:", beneficiaries);
        res.status(200).json({ beneficiarios: beneficiaries });
      } else {
        res.status(404).json({ message: "No se encontraron beneficiarios con los datos proporcionados." });
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
