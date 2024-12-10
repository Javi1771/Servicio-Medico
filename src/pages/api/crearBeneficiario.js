// /api/crearBeneficiario.js
import { connectToDatabase } from "./connectToDatabase";
import fetch from "node-fetch";

const getSindicato = (grupoNomina, cuotaSindical) => {
  if (grupoNomina === "NS") {
    return cuotaSindical === "S" ? "SUTSMSJR" : cuotaSindical === "" ? "SITAM" : null;
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
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
  } = req.body;

  try {
    // Validar longitud de los campos antes de la inserción
    const truncatedNombre = nombre?.substring(0, 50);
    const truncatedAPaterno = aPaterno?.substring(0, 50);
    const truncatedAMaterno = aMaterno?.substring(0, 50);
    const truncatedAlergias = alergias?.substring(0, 99);
    const truncatedSangre = sangre?.substring(0, 10);
    const truncatedTelEmergencia = telEmergencia?.substring(0, 12);
    const truncatedNombreEmergencia = nombreEmergencia?.substring(0, 99);
    const truncatedFotoUrl = imageUrl?.substring(0, 255);

    const pool = await connectToDatabase();

    // Inserción en la base de datos
    await pool.request()
      .input("noNomina", noNomina)
      .input("parentesco", parentesco)
      .input("nombre", truncatedNombre)
      .input("aPaterno", truncatedAPaterno)
      .input("aMaterno", truncatedAMaterno)
      .input("sexo", sexo)
      .input("fNacimiento", fNacimiento)
      .input("escolaridad", escolaridad || null)
      .input("activo", activo)
      .input("alergias", truncatedAlergias)
      .input("sangre", truncatedSangre)
      .input("telEmergencia", truncatedTelEmergencia)
      .input("nombreEmergencia", truncatedNombreEmergencia)
      .input("esEstudiante", esEstudiante)
      .input("esDiscapacitado", esDiscapacitado)
      .input("vigenciaEstudios", vigenciaEstudios || null)
      .input("imageUrl", truncatedFotoUrl)
      .query(`
        INSERT INTO BENEFICIARIO (
          NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, 
          F_NACIMIENTO, ESCOLARIDAD, ACTIVO, ALERGIAS, SANGRE, 
          TEL_EMERGENCIA, NOMBRE_EMERGENCIA, ESESTUDIANTE, ESDISCAPACITADO, 
          VIGENCIA_ESTUDIOS, FOTO_URL
        )
        VALUES (
          @noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, 
          @fNacimiento, @escolaridad, @activo, @alergias, @sangre, 
          @telEmergencia, @nombreEmergencia, @esEstudiante, @esDiscapacitado, 
          @vigenciaEstudios, @imageUrl
        )
      `);

    res.status(200).json({ message: "Beneficiario agregado correctamente" });
  } catch (error) {
    console.error("Error al agregar beneficiario:", error);
    res.status(500).json({ error: "Error al agregar beneficiario" });
  }
}
