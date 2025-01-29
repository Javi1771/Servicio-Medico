import { connectToDatabase } from "./connectToDatabase";

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
    urlIncap,           // Nuevo campo para incapacidad
    descriptorFacial,   // Descriptor facial
    // ÉSTAS SON LAS CLAVES UNIFICADAS:
    actaMatrimonioUrl,
    ineUrl,
    cartaNoAfiliacionUrl,
    actaConcubinatoUrl, // si la necesitas
  } = req.body;

  console.log("Datos recibidos en el backend:", req.body);

  // Validar datos obligatorios
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

  // Validación de 'activo'
  if (activo !== "A" && activo !== "I") {
    return res
      .status(400)
      .json({ message: "El valor de 'activo' debe ser 'A' o 'I'" });
  }

  // Validar formato de fechas
  const isValidDate = (date) => !isNaN(new Date(date).getTime());
  if (
    !isValidDate(fNacimiento) ||
    (vigenciaEstudios && !isValidDate(vigenciaEstudios))
  ) {
    return res.status(400).json({ message: "Formato de fecha inválido" });
  }

  try {
    const pool = await connectToDatabase();
    console.log("Conexión a la base de datos exitosa");

    // Convertir valores booleanos
    const estudianteValue = esEstudiante ? 1 : 0;
    const discapacitadoValue = esDiscapacitado ? 1 : 0;

    // Realizar la consulta de actualización
    const result = await pool
      .request()
      .input("idBeneficiario", idBeneficiario)
      .input("noNomina", noNomina)
      .input("parentesco", parentesco)
      .input("nombre", nombre)
      .input("aPaterno", aPaterno || null)
      .input("aMaterno", aMaterno || null)
      .input("sexo", sexo)
      .input("fNacimiento", new Date(fNacimiento).toISOString())
      .input("escolaridad", escolaridad || null)
      .input("activo", activo)
      .input("alergias", alergias || "")
      .input("sangre", sangre || "")
      .input("telEmergencia", telEmergencia)
      .input("nombreEmergencia", nombreEmergencia)
      .input("esEstudiante", estudianteValue)
      .input("esDiscapacitado", discapacitadoValue)
      .input(
        "vigenciaEstudios",
        vigenciaEstudios ? new Date(vigenciaEstudios).toISOString() : null
      )
      .input("imageUrl", imageUrl || null)
      .input("urlConstancia", urlConstancia || null)
      .input("urlCurp", urlCurp || null)
      .input("urlActaNac", urlActaNac || null)
      .input("urlIncap", urlIncap || null) // Acta de incapacidad
      .input("descriptorFacial", descriptorFacial || "")

      // Aquí unificamos con las mismas props:
      .input("actaMatrimonioUrl", actaMatrimonioUrl || null)
      .input("ineUrl", ineUrl || null)
      .input("cartaNoAfiliacionUrl", cartaNoAfiliacionUrl || null)
      .input("actaConcubinatoUrl", actaConcubinatoUrl || null)

      .query(`
        UPDATE BENEFICIARIO
        SET 
          NO_NOMINA = @noNomina,
          PARENTESCO = @parentesco,
          NOMBRE = @nombre,
          A_PATERNO = @aPaterno,
          A_MATERNO = @aMaterno,
          SEXO = @sexo,
          F_NACIMIENTO = @fNacimiento,
          ESCOLARIDAD = @escolaridad,
          ACTIVO = @activo,
          ALERGIAS = @alergias,
          SANGRE = @sangre,
          TEL_EMERGENCIA = @telEmergencia,
          NOMBRE_EMERGENCIA = @nombreEmergencia,
          ESESTUDIANTE = @esEstudiante,
          ESDISCAPACITADO = @esDiscapacitado,
          VIGENCIA_ESTUDIOS = @vigenciaEstudios,
          FOTO_URL = @imageUrl,
          URL_CONSTANCIA = @urlConstancia,
          URL_CURP = @urlCurp,
          URL_ACTA_NAC = @urlActaNac,
          URL_INCAP = @urlIncap,
          DESCRIPTOR_FACIAL = @descriptorFacial,
          -- Aquí amarramos las mismas variables al nombre de columna
          URL_ACTAMATRIMONIO = @actaMatrimonioUrl,
          URL_INE = @ineUrl,
          URL_NOISSTE = @cartaNoAfiliacionUrl,
          URL_CONCUBINATO = @actaConcubinatoUrl

        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

    console.log("Filas afectadas por la consulta:", result.rowsAffected[0]);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Beneficiario no encontrado o sin cambios" });
    }

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
