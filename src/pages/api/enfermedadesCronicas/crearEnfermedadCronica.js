import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { cronica } = req.body;

    // Validar que el campo 'cronica' no esté vacío y sea un string
    if (!cronica || typeof cronica !== "string") {
      console.error(
        'Error: El campo "cronica" es requerido y debe ser un string.'
      );
      return res
        .status(400)
        .json({ message: 'El campo "cronica" es requerido.' });
    }

    try {
      //console.log("Intentando conectar a la base de datos...");
      const pool = await connectToDatabase();
      //console.log("Conexión a la base de datos establecida.");

      // Inserción en CRONICAS con OUTPUT para obtener el id_enf_cronica generado
      const insertResult = await pool
        .request()
        .input("cronica", sql.VarChar, cronica)
        .input("estatus", sql.Bit, 1) // Estatus activo por defecto
        .query(`
          INSERT INTO CRONICAS (cronica, estatus)
          OUTPUT INSERTED.id_enf_cronica
          VALUES (@cronica, @estatus)
        `);

      // Se asume que el resultado devuelve el id en recordset[0].id_enf_cronica
      const insertedId = insertResult.recordset[0].id_enf_cronica;
      //console.log("Enfermedad crónica insertada, id_enf_cronica:", insertedId);

      // Registrar la actividad "Agregó una enfermedad crónica"
      const rawCookies = req.headers.cookie || "";
      const claveusuarioCookie = rawCookies
        .split("; ")
        .find((row) => row.startsWith("claveusuario="))
        ?.split("=")[1];
      const claveusuario = claveusuarioCookie
        ? Number(claveusuarioCookie)
        : null;
      //console.log("Cookie claveusuario:", claveusuario);

      if (claveusuario !== null) {
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        const userAgent = req.headers["user-agent"] || "";
        await pool
          .request()
          .input("userId", sql.Int, claveusuario)
          .input("accion", sql.VarChar, "Agregó una enfermedad crónica")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          // Se envían null para ClaveConsulta e IdBeneficiario
          .input("claveConsulta", sql.Int, null)
          .input("idBeneficiario", sql.Int, null)
          .input("idEnfCronica", sql.Int, insertedId).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario, IdEnfCronica)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario, @idEnfCronica)
          `);
        // console.log(
        //   "Actividad 'Agregó una enfermedad crónica' registrada en ActividadUsuarios."
        // );
      } else {
        //console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      return res.status(201).json({
        message: "Enfermedad crónica agregada exitosamente",
        id_enf_cronica: insertedId,
      });
    } catch (error) {
      console.error("Error al agregar la enfermedad crónica:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });

      if (error.message.includes("duplicate key")) {
        return res
          .status(409)
          .json({ message: "La enfermedad crónica ya existe." });
      } else {
        return res.status(500).json({
          message: "Error al agregar la enfermedad crónica.",
          error: error.message,
        });
      }
    }
  } else {
    console.warn(`Método ${req.method} no permitido en esta ruta.`);
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }
}
