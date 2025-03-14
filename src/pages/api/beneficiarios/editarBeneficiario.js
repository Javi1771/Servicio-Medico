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
  } = req.body;

  console.log("Datos recibidos en el backend para actualizar:", req.body);

  // Validar campos obligatorios
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

    // Forzar la conversión a string para evitar errores en la validación
    const parentescoStr = String(parentesco);

    // Realizar la consulta de actualización
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
      .input("esEstudiante", sql.Bit, estudianteValue)
      .input("esDiscapacitado", sql.Bit, discapacitadoValue)
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

    // Registrar la actividad "Editó un beneficiario"
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie ? Number(claveusuarioCookie) : null;
    console.log("Cookie claveusuario:", claveusuario);

    if (claveusuario !== null) {
      let ip = req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection?.socket ? req.connection.socket.remoteAddress : null);      const userAgent = req.headers["user-agent"] || "";
      await pool.request()
        .input("userId", sql.Int, claveusuario)
        .input("accion", sql.VarChar, "Editó un beneficiario")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("claveConsulta", sql.Int, null)
        .input("idBeneficiario", sql.Int, idBeneficiario)
        .query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario)
        `);
      console.log("Actividad 'Editó un beneficiario' registrada en ActividadUsuarios.");
    } else {
      console.log("No se pudo registrar la actividad: falta claveusuario.");
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
