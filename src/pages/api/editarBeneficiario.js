import { connectToDatabase } from "./connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    idBeneficiario, // Es obligatorio para la edición
    noNomina,       // Número de nómina
    parentesco,     // ID del parentesco (smallint)
    nombre,         // Nombre del beneficiario
    aPaterno,       // Apellido paterno
    aMaterno,       // Apellido materno
    sexo,           // Sexo
    fNacimiento,    // Fecha de nacimiento en formato ISO
    escolaridad,    // Nivel de escolaridad (puede ser null)
    activo,         // Estado del beneficiario ("A" o "I")
    alergias,       // Información sobre alergias
    sangre,         // Tipo de sangre
    telEmergencia,  // Teléfono de emergencia
    nombreEmergencia, // Nombre del contacto de emergencia
    esEstudiante,   // Si es estudiante (1 o 0)
    esDiscapacitado, // Si es discapacitado (1 o 0)
    vigenciaEstudios, // Vigencia de estudios en formato ISO (puede ser null)
    imageUrl,        // URL de la imagen del beneficiario
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

  try {
    const pool = await connectToDatabase();
    console.log("Conexión a la base de datos exitosa");

    await pool
      .request()
      .input("idBeneficiario", idBeneficiario)
      .input("noNomina", noNomina)
      .input("parentesco", parentesco) // ID del parentesco
      .input("nombre", nombre)
      .input("aPaterno", aPaterno || null) // Puede ser null
      .input("aMaterno", aMaterno || null) // Puede ser null
      .input("sexo", sexo)
      .input("fNacimiento", fNacimiento)
      .input("escolaridad", escolaridad || null) // Puede ser null
      .input("activo", activo)
      .input("alergias", alergias || "")
      .input("sangre", sangre || "")
      .input("telEmergencia", telEmergencia)
      .input("nombreEmergencia", nombreEmergencia)
      .input("esEstudiante", esEstudiante || 0) // 0 por defecto
      .input("esDiscapacitado", esDiscapacitado || 0) // 0 por defecto
      .input("vigenciaEstudios", vigenciaEstudios || null) // Puede ser null
      .input("imageUrl", imageUrl || null) // Puede ser null
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
          FOTO_URL = @imageUrl
        WHERE ID_BENEFICIARIO = @idBeneficiario
      `);

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
