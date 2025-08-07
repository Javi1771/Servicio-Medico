import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nomina } = req.body;
    //console.log("Nomina recibida:", nomina);

    try {
      const pool = await connectToDatabase();
      const result = await pool.request().input("nomina", sql.VarChar, nomina)
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
            B.PARENTESCO,
            B.URL_INCAP,
            P.ID_PARENTESCO AS ID_PARENTESCO,
            P.PARENTESCO AS PARENTESCO_DESC,
            DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()) AS YEARS,
            DATEDIFF(MONTH, DATEADD(YEAR, DATEDIFF(YEAR, B.F_NACIMIENTO, GETDATE()), B.F_NACIMIENTO), GETDATE()) AS MONTHS
          FROM BENEFICIARIO B
          LEFT JOIN PARENTESCO P ON B.PARENTESCO = P.ID_PARENTESCO
          WHERE B.NO_NOMINA = @nomina
        `);

      //console.log("Resultados de la consulta:", result.recordset);

      if (result.recordset.length > 0) {
        const beneficiaries = result.recordset
          .filter((beneficiary) => {
            //console.log("Validando beneficiario:", beneficiary);

            //* Validar que el beneficiario esté activo
            if (beneficiary.ACTIVO !== "A") {
              //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} no está activo` );
              return false;
            }

            //* Si el parentesco es 2, aplicar validaciones adicionales
            if (beneficiary.ID_PARENTESCO === 2) {
              //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} tiene parentesco 2, aplicando validaciones adicionales` );

              //* Validar si es discapacitado
              if (beneficiary.ESDISCAPACITADO === 0) {
                //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} no es discapacitado` );
                return false; //! No pasa la validación si no es discapacitado

                //* Validar si tiene URL de incapacidad
              } else {
                if (!beneficiary.URL_INCAP) {
                  //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} no tiene URL de incapacidad` );
                  return false; //! No pasa la validación si no es discapacitado y no tiene
                } 

                //* Validar si es estudiante
                if (beneficiary.ESESTUDIANTE === 0) {
                  //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} no es estudiante` );
                  return false; //! No pasa la validación si no es estudiante
                }

                //* Validar vigencia de estudios
                const vigenciaEstudios = new Date(
                  beneficiary.VIGENCIA_ESTUDIOS
                ); //* Convertir a Date
                const fechaActual = new Date(); //* Obtener fecha actual como objeto Date

                //console.log(`Validando vigencia de estudios para el beneficiario ${beneficiary.ID_BENEFICIARIO}:`, vigenciaEstudios );

                if (vigenciaEstudios < fechaActual) {
                  //console.log( `Beneficiario ${beneficiary.ID_BENEFICIARIO} tiene vigencia de estudios expirada: ${vigenciaEstudios}`);
                  return false; //! No pasa la validación si la vigencia ha expirado
                }
              }
            }

            //* Si no es parentesco 2 o pasa todas las validaciones, se incluye
            return true;
          })
          .map((beneficiary) => {
            //* Calcular edad en años, meses y días
            const fechaNacimiento = new Date(beneficiary.F_NACIMIENTO);
            const today = new Date();

            let years = beneficiary.YEARS;
            let months = beneficiary.MONTHS;

            //* Calcular días restantes
            let days = today.getDate() - fechaNacimiento.getDate();
            if (days < 0) {
              months -= 1;
              const lastMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                0
              );
              days += lastMonth.getDate();
            }

            //* Ajustar los años y meses en caso de que los meses sean negativos
            if (months < 0) {
              years -= 1;
              months += 12;
            }

            const beneficiarioFinal = {
              ...beneficiary,
              YEARS: years,
              MONTHS: months,
              DAYS: days,
              EDAD: `${years} años, ${months} meses, ${days} días`,
            };

            //console.log("Beneficiario final procesado:", beneficiarioFinal);
            return beneficiarioFinal;
          });

        //console.log("Lista de beneficiarios después de procesar:", beneficiaries );
        res.status(200).json({ beneficiarios: beneficiaries });
      } else {
        res
          .status(404)
          .json({
            message: "No se encontraron beneficiarios para esta nómina",
          });
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
