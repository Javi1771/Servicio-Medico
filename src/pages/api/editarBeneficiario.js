import { connectToDatabase } from "../api/connectToDatabase";

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const {
      idBeneficiario,
      parentesco,
      nombre,
      aPaterno,
      aMaterno,
      sexo,
      fNacimiento,
      alergias,
      vigencia,
      sangre,
      telEmergencia,
      nombreEmergencia,
      activo, // Estado de actividad (A o I)
      curp,
      situacion_lab,
      enfermedades_cronicas,
      tratamientos,
      domicilio,
      observaciones,
      esEstudiante,
      vigenciaEstudiosInicio,
      vigenciaEstudiosFin,
      esDiscapacitado,
      imageUrl, // Añadido para manejar la imagen
    } = req.body; // Incluyendo todas las propiedades necesarias

    if (!idBeneficiario) {
      return res
        .status(400)
        .json({ message: "ID del beneficiario es requerido" });
    }

    // Debug para verificar que los valores se reciben correctamente
    console.log("Valores recibidos:", {
      idBeneficiario,
      parentesco,
      nombre,
      aPaterno,
      aMaterno,
      sexo,
      fNacimiento,
      alergias,
      vigencia,
      sangre,
      telEmergencia,
      nombreEmergencia,
      activo,
      curp,
      situacion_lab,
      enfermedades_cronicas,
      tratamientos,
      domicilio,
      observaciones,
      esEstudiante,
      vigenciaEstudiosInicio,
      vigenciaEstudiosFin,
      esDiscapacitado,
      imageUrl, // Añadido para manejar la imagen
    });

    // Validación adicional: verificar que 'activo' sea "A" o "I"
    if (activo !== "A" && activo !== "I") {
      return res
        .status(400)
        .json({ message: "Valor de 'activo' no válido. Debe ser 'A' o 'I'." });
    }

    try {
      const pool = await connectToDatabase();
      console.log("Conexión a la base de datos exitosa");

      await pool
        .request()
        .input("idBeneficiario", idBeneficiario)
        .input("parentesco", parentesco)
        .input("nombre", nombre)
        .input("aPaterno", aPaterno)
        .input("aMaterno", aMaterno)
        .input("sexo", sexo)
        .input("fNacimiento", fNacimiento)
        .input("alergias", alergias)
        .input("vigencia", vigencia || null)
        .input("sangre", sangre)
        .input("telEmergencia", telEmergencia)
        .input("nombreEmergencia", nombreEmergencia)
        .input("activo", activo)
        .input("curp", curp || null)
        .input("situacion_lab", situacion_lab || null)
        .input("enfermedades_cronicas", enfermedades_cronicas || null)
        .input("tratamientos", tratamientos || null)
        .input("domicilio", domicilio || null)
        .input("observaciones", observaciones || null)
        .input("esEstudiante", esEstudiante || "No")
        .input("vigenciaEstudiosInicio", vigenciaEstudiosInicio || null)
        .input("vigenciaEstudiosFin", vigenciaEstudiosFin || null)
        .input("esDiscapacitado", esDiscapacitado || "No")
        .input("imageUrl", imageUrl || null).query(`
          UPDATE BENEFICIARIO
          SET PARENTESCO = @parentesco,
              NOMBRE = @nombre,
              A_PATERNO = @aPaterno,
              A_MATERNO = @aMaterno,
              SEXO = @sexo,
              F_NACIMIENTO = @fNacimiento,
              ALERGIAS = @alergias,
              VIGENCIA = @vigencia,
              SANGRE = @sangre,
              TEL_EMERGENCIA = @telEmergencia,
              NOMBRE_EMERGENCIA = @nombreEmergencia,
              [ACTIVO] = @activo,
              CURP = @curp,
              SITUACION_LAB = @situacion_lab,
              ENFERMEDADES_CRONICAS = @enfermedades_cronicas,
              TRATAMIENTOS = @tratamientos,
              DOMICILIO = @domicilio,
              OBSERVACIONES = @observaciones,
              ESESTUDIANTE = @esEstudiante,
              VIGENCIA_ESTUDIOS_INICIO = @vigenciaEstudiosInicio,
              VIGENCIA_ESTUDIOS_FIN = @vigenciaEstudiosFin,
              ESDISCAPACITADO = @esDiscapacitado,
              FOTO_URL = @imageUrl 
          WHERE ID_BENEFICIARIO = @idBeneficiario
        `);

      res
        .status(200)
        .json({ message: "Beneficiario actualizado correctamente" });
    } catch (error) {
      console.error("Error al actualizar el beneficiario:", error);
      res.status(500).json({ message: "Error al actualizar el beneficiario" });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
