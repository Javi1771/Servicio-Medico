import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

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
    urlConstancia,
    urlCurp,
    urlActaNac,
    actaMatrimonioUrl,
    ineUrl,
    cartaNoAfiliacionUrl,
    actaConcubinatoUrl,
    actaDependenciaEconomicaUrl,
    urlIncap,
    descriptorFacial,
    //-------------------- NUEVO CAMPO --------------------//
    firma, // Aquí recibimos la firma en base64
  } = req.body;

  try {
    //* Truncar campos según límites de la BD
    const truncatedNombre = nombre?.substring(0, 50);
    const truncatedAPaterno = aPaterno?.substring(0, 50);
    const truncatedAMaterno = aMaterno?.substring(0, 50);
    const truncatedAlergias = alergias?.substring(0, 99);
    const truncatedSangre = sangre?.substring(0, 10);
    const truncatedTelEmergencia = telEmergencia?.substring(0, 12);
    const truncatedNombreEmergencia = nombreEmergencia?.substring(0, 99);
    const truncatedFotoUrl = imageUrl?.substring(0, 255);
    const truncatedUrlConstancia = urlConstancia?.substring(0, 255);
    const truncatedUrlCurp = urlCurp?.substring(0, 255);
    const truncatedUrlActaNac = urlActaNac?.substring(0, 255);
    const truncatedActaMatrimonioUrl = actaMatrimonioUrl?.substring(0, 255);
    const truncatedIneUrl = ineUrl?.substring(0, 255);
    const truncatedCartaNoAfiliacionUrl = cartaNoAfiliacionUrl?.substring(
      0,
      255
    );
    const truncatedActaConcubinatoUrl = actaConcubinatoUrl?.substring(0, 255);
    const truncatedActaDependenciaEconomicaUrl =
      actaDependenciaEconomicaUrl?.substring(0, 255);
    const truncatedUrlIncap = urlIncap?.substring(0, 255);

    const pool = await connectToDatabase();

    //* Inserción en BENEFICIARIO con OUTPUT para obtener el ID insertado
    const insertResult = await pool
      .request()
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
      .input("urlConstancia", truncatedUrlConstancia)
      .input("urlCurp", truncatedUrlCurp)
      .input("urlActaNac", truncatedUrlActaNac)
      .input("actaMatrimonioUrl", truncatedActaMatrimonioUrl)
      .input("ineUrl", truncatedIneUrl)
      .input("cartaNoAfiliacionUrl", truncatedCartaNoAfiliacionUrl)
      .input("actaConcubinatoUrl", truncatedActaConcubinatoUrl)
      .input("actaDependenciaEconomicaUrl", truncatedActaDependenciaEconomicaUrl)
      .input("urlIncap", truncatedUrlIncap)
      //-------------------- NUEVO CAMPO --------------------//
      .input("firma", firma || "") // Guardamos la firma en la BD
      .input("descriptorFacial", descriptorFacial || "").query(`
        INSERT INTO BENEFICIARIO (
          NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, 
          F_NACIMIENTO, ESCOLARIDAD, ACTIVO, ALERGIAS, SANGRE, 
          TEL_EMERGENCIA, NOMBRE_EMERGENCIA, ESESTUDIANTE, ESDISCAPACITADO, 
          VIGENCIA_ESTUDIOS, FOTO_URL, URL_CONSTANCIA, 
          URL_CURP, URL_ACTA_NAC, URL_ACTAMATRIMONIO, URL_INE, URL_NOISSTE, 
          URL_CONCUBINATO, URL_INCAP, DESCRIPTOR_FACIAL, FIRMA, URL_ACTADEPENDENCIAECONOMICA
        )
        OUTPUT INSERTED.ID_BENEFICIARIO
        VALUES (
          @noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, 
          @fNacimiento, @escolaridad, @activo, @alergias, @sangre, 
          @telEmergencia, @nombreEmergencia, @esEstudiante, @esDiscapacitado, 
          @vigenciaEstudios, @imageUrl, @urlConstancia, 
          @urlCurp, @urlActaNac, @actaMatrimonioUrl, @ineUrl, @cartaNoAfiliacionUrl, 
          @actaConcubinatoUrl, @urlIncap, @descriptorFacial, @firma, @actaDependenciaEconomicaUrl
        )
      `);

    //console.log("Resultado de la inserción:", insertResult);
    //* Verifica el objeto insertResult para confirmar la propiedad exacta del ID
    const insertedId = insertResult.recordset[0].ID_BENEFICIARIO;
    //console.log("Beneficiario insertado, ID:", insertedId);

    //* Obtener la cookie "claveusuario"
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie ? Number(claveusuarioCookie) : null;
    //console.log("Cookie claveusuario:", claveusuario);

    //* Registrar la actividad en ActividadUsuarios incluyendo el ID del beneficiario
    if (claveusuario !== null) {
      let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const userAgent = req.headers["user-agent"] || "";
      const activityResult = await pool
        .request()
        .input("userId", sql.Int, claveusuario)
        .input("accion", sql.VarChar, "Guardó un beneficiario")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("claveConsulta", sql.Int, null)
        .input("idBeneficiario", sql.Int, insertedId).query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario)
        `);
      console.log("Actividad registrada:", activityResult);
    } else {
      console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    res.status(200).json({
      message: "Beneficiario agregado con descriptor facial",
      id: insertedId,
    });
  } catch (error) {
    console.error("Error al agregar beneficiario:", error);
    res.status(500).json({ error: "Error al agregar beneficiario" });
  }
}
