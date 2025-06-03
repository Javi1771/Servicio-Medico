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
    vigenciaEstudios,   // <-- lo recibimos como string
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
    // -------------------- NUEVO CAMPO --------------------//
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
    const truncatedCartaNoAfiliacionUrl = cartaNoAfiliacionUrl?.substring(0, 255);
    const truncatedActaConcubinatoUrl = actaConcubinatoUrl?.substring(0, 255);
    const truncatedActaDependenciaEconomicaUrl =
      actaDependenciaEconomicaUrl?.substring(0, 255);
    const truncatedUrlIncap = urlIncap?.substring(0, 255);
    const truncatedFirma = firma?.substring(0, 8000); // ajusta según tamaño de tu columna

    const pool = await connectToDatabase();

    //* Inserción en BENEFICIARIO con OUTPUT para obtener el ID insertado
    const insertResult = await pool
      .request()
      .input("noNomina", sql.VarChar(50), noNomina)
      .input("parentesco", sql.Int, parentesco)
      .input("nombre", sql.VarChar(50), truncatedNombre)
      .input("aPaterno", sql.VarChar(50), truncatedAPaterno)
      .input("aMaterno", sql.VarChar(50), truncatedAMaterno)
      .input("sexo", sql.Char(1), sexo)
      .input("fNacimiento", sql.Date, fNacimiento)
      .input("escolaridad", sql.VarChar(50), escolaridad || null)
      .input("activo", sql.Char(1), activo)
      .input("alergias", sql.VarChar(99), truncatedAlergias)
      .input("sangre", sql.VarChar(10), truncatedSangre)
      .input("telEmergencia", sql.VarChar(12), truncatedTelEmergencia)
      .input("nombreEmergencia", sql.VarChar(99), truncatedNombreEmergencia)
      .input("esEstudiante", sql.Bit, esEstudiante)
      .input("esDiscapacitado", sql.Bit, esDiscapacitado)
      // ───────────────────────────────────────────────────────────────
      // Aquí tratamos vigenciaEstudios como texto plano:
      .input("vigenciaEstudios", sql.VarChar(50), vigenciaEstudios || null)
      // ───────────────────────────────────────────────────────────────
      .input("imageUrl", sql.VarChar(255), truncatedFotoUrl)
      .input("urlConstancia", sql.VarChar(255), truncatedUrlConstancia)
      .input("urlCurp", sql.VarChar(255), truncatedUrlCurp)
      .input("urlActaNac", sql.VarChar(255), truncatedUrlActaNac)
      .input("actaMatrimonioUrl", sql.VarChar(255), truncatedActaMatrimonioUrl)
      .input("ineUrl", sql.VarChar(255), truncatedIneUrl)
      .input("cartaNoAfiliacionUrl", sql.VarChar(255), truncatedCartaNoAfiliacionUrl)
      .input("actaConcubinatoUrl", sql.VarChar(255), truncatedActaConcubinatoUrl)
      .input(
        "actaDependenciaEconomicaUrl",
        sql.VarChar(255),
        truncatedActaDependenciaEconomicaUrl
      )
      .input("urlIncap", sql.VarChar(255), truncatedUrlIncap)
      .input("descriptorFacial", sql.VarChar(sql.MAX), descriptorFacial || null)
      .input("firma", sql.VarChar(sql.MAX), truncatedFirma)
      .query(`
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

    const insertedId = insertResult.recordset[0].ID_BENEFICIARIO;

    // Registrar actividad de usuario (igual que antes)...
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie ? Number(claveusuarioCookie) : null;

    if (claveusuario !== null) {
      let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket
          ? req.connection.socket.remoteAddress
          : null);

      const userAgent = req.headers["user-agent"] || "";
      await pool
        .request()
        .input("userId", sql.Int, claveusuario)
        .input("accion", sql.VarChar, "Guardó un beneficiario")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("claveConsulta", sql.Int, null)
        .input("idBeneficiario", sql.Int, insertedId)
        .query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario)
        `);
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
