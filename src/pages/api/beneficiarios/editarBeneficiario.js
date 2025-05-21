import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    idBeneficiario,
    noNomina,
    parentesco,
    nombre,
    aPaterno,
    aMaterno,
    sexo,
    fNacimiento,
    escolaridad,
    activo,
    alergias,
    sangre,
    telEmergencia,
    nombreEmergencia,
    esEstudiante,
    esDiscapacitado,
    vigenciaEstudios,
    imageUrl,
    urlConstancia,
    urlCurp,
    urlActaNac,
    urlIncap,
    descriptorFacial,
    actaMatrimonioUrl,
    ineUrl,
    cartaNoAfiliacionUrl,
    actaConcubinatoUrl,
    actaDependenciaEconomicaUrl, // <-- nuevo campo
    firma,
  } = req.body;

  // Validaciones básicas
  if (
    !idBeneficiario ||
    !noNomina ||
    !parentesco ||
    !nombre ||
    !sexo ||
    !fNacimiento ||
    !telEmergencia ||
    !nombreEmergencia
  ) {
    return res
      .status(400)
      .json({ message: "Faltan campos obligatorios en la solicitud" });
  }
  if (activo !== "A" && activo !== "I") {
    return res
      .status(400)
      .json({ message: "El valor de 'activo' debe ser 'A' o 'I'" });
  }
  const isValidDate = (d) => !isNaN(new Date(d).getTime());
  if (
    !isValidDate(fNacimiento) ||
    (vigenciaEstudios && !isValidDate(vigenciaEstudios))
  ) {
    return res.status(400).json({ message: "Formato de fecha inválido" });
  }

  try {
    const pool = await connectToDatabase();

    // Convertir booleanos a bit
    const estudianteBit = esEstudiante ? 1 : 0;
    const discapacitadoBit = esDiscapacitado ? 1 : 0;
    const parentescoStr = String(parentesco);

    const result = await pool
      .request()
      .input("idBeneficiario", sql.Int, idBeneficiario)
      .input("noNomina", sql.VarChar, noNomina)
      .input("parentesco", sql.VarChar, parentescoStr)
      .input("nombre", sql.VarChar, nombre)
      .input("aPaterno", sql.VarChar, aPaterno || null)
      .input("aMaterno", sql.VarChar, aMaterno || null)
      .input("sexo", sql.VarChar, sexo)
      .input("fNacimiento", sql.DateTime, new Date(fNacimiento))
      .input("escolaridad", sql.VarChar, escolaridad || null)
      .input("activo", sql.VarChar, activo)
      .input("alergias", sql.VarChar, alergias || "")
      .input("sangre", sql.VarChar, sangre || "")
      .input("telEmergencia", sql.VarChar, telEmergencia)
      .input("nombreEmergencia", sql.VarChar, nombreEmergencia)
      .input("esEstudiante", sql.Bit, estudianteBit)
      .input("esDiscapacitado", sql.Bit, discapacitadoBit)
      .input(
        "vigenciaEstudios",
        sql.DateTime,
        vigenciaEstudios ? new Date(vigenciaEstudios) : null
      )
      .input("imageUrl", sql.VarChar, imageUrl || null)
      .input("urlConstancia", sql.VarChar, urlConstancia || null)
      .input("urlCurp", sql.VarChar, urlCurp || null)
      .input("urlActaNac", sql.VarChar, urlActaNac || null)
      .input("urlIncap", sql.VarChar, urlIncap || null)
      .input("descriptorFacial", sql.VarChar, descriptorFacial || "")
      .input("actaMatrimonioUrl", sql.VarChar, actaMatrimonioUrl || null)
      .input("ineUrl", sql.VarChar, ineUrl || null)
      .input("cartaNoAfiliacionUrl", sql.VarChar, cartaNoAfiliacionUrl || null)
      .input("actaConcubinatoUrl", sql.VarChar, actaConcubinatoUrl || null)
      .input(
        "actaDependenciaEconomicaUrl",
        sql.VarChar,
        actaDependenciaEconomicaUrl || null
      ) // <-- nuevo INPUT
      .input("firma", sql.VarChar, firma && firma.trim() ? firma : null)
      .query(`
        UPDATE BENEFICIARIO
        SET
          NO_NOMINA       = @noNomina,
          PARENTESCO      = @parentesco,
          NOMBRE          = @nombre,
          A_PATERNO       = @aPaterno,
          A_MATERNO       = @aMaterno,
          SEXO            = @sexo,
          F_NACIMIENTO    = @fNacimiento,
          ESCOLARIDAD     = @escolaridad,
          ACTIVO          = @activo,
          ALERGIAS        = @alergias,
          SANGRE          = @sangre,
          TEL_EMERGENCIA  = @telEmergencia,
          NOMBRE_EMERGENCIA = @nombreEmergencia,
          ESESTUDIANTE    = @esEstudiante,
          ESDISCAPACITADO = @esDiscapacitado,
          VIGENCIA_ESTUDIOS           = @vigenciaEstudios,
          FOTO_URL       = @imageUrl,
          URL_CONSTANCIA  = @urlConstancia,
          URL_CURP        = @urlCurp,
          URL_ACTA_NAC    = @urlActaNac,
          URL_INCAP       = @urlIncap,
          DESCRIPTOR_FACIAL            = @descriptorFacial,
          URL_ACTAMATRIMONIO           = @actaMatrimonioUrl,
          URL_INE                      = @ineUrl,
          URL_NOISSTE                  = @cartaNoAfiliacionUrl,
          URL_CONCUBINATO              = @actaConcubinatoUrl,
          URL_ACTADEPENDENCIAECONOMICA = @actaDependenciaEconomicaUrl,  -- <–– agregado
          FIRMA           = @firma
        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Beneficiario no encontrado o sin cambios" });
    }

    // (Opcional) registrar actividad en ActividadUsuarios...
    // ...

    return res
      .status(200)
      .json({ message: "Beneficiario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el beneficiario:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar el beneficiario" });
  }
}
