import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      descripcion,
      clavenomina,
      clavepaciente,
      tipoAntecedente,
      fechaInicioEnfermedad,
    } = req.body;

    //* Validar datos obligatorios
    if (
      !descripcion ||
      !clavenomina ||
      !clavepaciente ||
      !tipoAntecedente ||
      !fechaInicioEnfermedad
    ) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    try {
      const pool = await connectToDatabase();

      //* Insertar el nuevo antecedente y obtener el ID insertado con SCOPE_IDENTITY()
      const result = await pool
        .request()
        .input("descripcion", sql.NVarChar(sql.MAX), descripcion)
        .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
        .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente)
        .input("tipo_antecedente", sql.NVarChar(sql.MAX), tipoAntecedente)
        .input("fecha_inicio_enfermedad", sql.DateTime, fechaInicioEnfermedad)
        .query(`
          INSERT INTO antecedentes_clinicos 
            (descripcion, clavenomina, clavepaciente, tipo_antecedente, fecha_inicio_enfermedad)
          VALUES 
            (@descripcion, @clavenomina, @clavepaciente, @tipo_antecedente, @fecha_inicio_enfermedad);
          SELECT SCOPE_IDENTITY() AS idAntecedente;
        `);

      const idAntecedente = result.recordset[0].idAntecedente;
      console.log("🔑 Nuevo antecedente insertado con id:", idAntecedente);

      //* Registrar la actividad "Asignó antecedente" en la tabla ActividadUsuarios
      try {
        //* Primero, obtenemos la claveConsulta del último registro en la tabla "consultas"
        //* que coincida con clavenomina y clavepaciente
        const consultaQuery = `
          SELECT TOP 1 claveConsulta
          FROM consultas
          WHERE clavenomina = @clavenomina AND clavepaciente = @clavepaciente
          ORDER BY claveConsulta DESC
        `;
        const consultaResult = await pool
          .request()
          .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
          .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente)
          .query(consultaQuery);

        let fetchedClaveConsulta = null;
        if (consultaResult.recordset.length > 0) {
          fetchedClaveConsulta = consultaResult.recordset[0].claveConsulta;
          //console.log("🔑 ClaveConsulta obtenida de la tabla consultas:", fetchedClaveConsulta );
        } else {
          //console.log( "No se encontró claveConsulta en consultas para clavenomina:", clavenomina, "y clavepaciente:", clavepaciente );
        }

        //* Obtener la cookie "claveusuario"
        const rawCookies = req.headers.cookie || "";
        const claveusuarioCookie = rawCookies
          .split("; ")
          .find((row) => row.startsWith("claveusuario="))
          ?.split("=")[1];
        const claveusuario = claveusuarioCookie
          ? Number(claveusuarioCookie)
          : null;
        //console.log("Cookie claveusuario:", claveusuario);

        if (claveusuario !== null && fetchedClaveConsulta !== null) {
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
            .input("accion", sql.VarChar, "Guardó un antecedente")
            .input("direccionIP", sql.VarChar, ip)
            .input("agenteUsuario", sql.VarChar, userAgent)
            .input("claveConsulta", sql.Int, fetchedClaveConsulta).query(`
              INSERT INTO dbo.ActividadUsuarios 
                (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
              VALUES 
                (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
            `);
          //console.log( "Actividad 'Asignó antecedente' registrada en ActividadUsuarios." );
        } else {
          //console.log( "No se pudo registrar la actividad: falta claveusuario o claveConsulta." );
        }
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      //* Opcional: Obtener historial actualizado de antecedentes
      const resultHist = await pool
        .request()
        .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
        .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente).query(`
          SELECT 
            id_antecedente,
            descripcion,
            clavenomina,
            tipo_antecedente,
            fecha_registro,
            fecha_inicio_enfermedad
          FROM antecedentes_clinicos
          WHERE clavenomina = @clavenomina
            AND clavepaciente = @clavepaciente
        `);

      const historial = resultHist.recordset;

      res.status(200).json({
        message: "Antecedente guardado correctamente.",
        nuevoAntecedente: historial,
      });
    } catch (error) {
      console.error("Error al guardar el antecedente:", error);
      res
        .status(500)
        .json({ message: "Error al guardar el antecedente.", error });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
