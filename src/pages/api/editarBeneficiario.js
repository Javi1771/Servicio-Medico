import { connectToDatabase } from "./connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    idBeneficiario, // Es obligatorio para la edición
    noNomina, // Número de nómina
    parentesco, // ID del parentesco (smallint)
    nombre, // Nombre del beneficiario
    aPaterno, // Apellido paterno
    aMaterno, // Apellido materno
    sexo, // Sexo
    fNacimiento, // Fecha de nacimiento en formato ISO
    escolaridad, // Nivel de escolaridad (puede ser null)
    activo, // Estado del beneficiario ("A" o "I")
    alergias, // Información sobre alergias
    sangre, // Tipo de sangre
    telEmergencia, // Teléfono de emergencia
    nombreEmergencia, // Nombre del contacto de emergencia
    esEstudiante, // Si es estudiante (1 o 0)
    esDiscapacitado, // Si es discapacitado (1 o 0)
    vigenciaEstudios, // Vigencia de estudios en formato ISO (puede ser null)
    imageUrl, // URL de la imagen del beneficiario
    urlConstancia, // Nuevo campo para la URL de la constancia
    urlCurp, // Nuevo campo para la URL del CURP
    urlActaNac, // Nuevo campo para la URL del Acta de Nacimiento
    urlINE, // Nuevo campo para la URL del INE
    urlActaMatrimonio, // Nuevo campo para la URL del Acta de Matrimonio
    urlCartaNoAfiliacion, // Nuevo campo para la URL de la Carta de No Afiliación
  } = req.body;

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

    const result = await pool
      .request()
      .input("idBeneficiario", idBeneficiario)
      .input("noNomina", noNomina)
      .input("parentesco", parentesco) // ID del parentesco
      .input("nombre", nombre)
      .input("aPaterno", aPaterno || null) // Puede ser null
      .input("aMaterno", aMaterno || null) // Puede ser null
      .input("sexo", sexo)
      .input("fNacimiento", new Date(fNacimiento).toISOString()) // Convertir a ISO
      .input("escolaridad", escolaridad || null) // Puede ser null
      .input("activo", activo)
      .input("alergias", alergias || "")
      .input("sangre", sangre || "")
      .input("telEmergencia", telEmergencia)
      .input("nombreEmergencia", nombreEmergencia)
      .input("esEstudiante", estudianteValue) // Convertido a 1 o 0
      .input("esDiscapacitado", discapacitadoValue) // Convertido a 1 o 0
      .input(
        "vigenciaEstudios",
        vigenciaEstudios ? new Date(vigenciaEstudios).toISOString() : null
      ) // Convertir a ISO si no es null
      .input("imageUrl", imageUrl || null) // Puede ser null
      .input("urlConstancia", urlConstancia || null) // Nuevo campo URL_CONSTANCIA
      .input("urlCurp", urlCurp || null) // Nuevo campo URL_CURP
      .input("urlActaNac", urlActaNac || null) // Nuevo campo URL_ACTA_NAC
      .input("urlINE", urlINE || null) // Correcto
      .input("urlActaMatrimonio", urlActaMatrimonio || null) // Cambiado para coincidir
      .input("urlCartaNoAfiliacion", urlCartaNoAfiliacion || null) // Correcto
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
      URL_INE = @urlINE,
      URL_ACTAMATRIMONIO = @urlActaMatrimonio, -- Cambiado
      URL_NOISSTE = @urlCartaNoAfiliacion -- Correcto
        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

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
