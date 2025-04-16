import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { especialidad } = req.body;

    if (!especialidad || typeof especialidad !== "string") {
      return res
        .status(400)
        .json({ message: 'El campo "especialidad" es requerido.' });
    }

    try {
      const pool = await connectToDatabase();

      //* Inserta la nueva especialidad y obtiene la claveespecialidad generada
      const insertResult = await pool
        .request()
        .input("especialidad", sql.VarChar, especialidad)
        .input("estatus", sql.Bit, 1) //* Estatus activo por defecto
        .query(`
          INSERT INTO especialidades (especialidad, estatus)
          OUTPUT INSERTED.claveespecialidad
          VALUES (@especialidad, @estatus)
        `);

      //* Se asume que el resultado devuelve la clave en recordset[0].claveespecialidad
      const insertedClave = insertResult.recordset[0].claveespecialidad;
      //console.log("Especialidad insertada, claveespecialidad:", insertedClave);

      //* Registrar la actividad "Agregó una especialidad"
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
          .input("accion", sql.VarChar, "Agregó una especialidad")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          //* Se envían null para ClaveConsulta e IdBeneficiario
          .input("claveConsulta", sql.Int, null)
          .input("idBeneficiario", sql.Int, null)
          .input("idEspecialidad", sql.Int, insertedClave).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario, IdEspecialidad)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario, @idEspecialidad)
          `);
        // console.log(
        //   "Actividad 'Agregó una especialidad' registrada en ActividadUsuarios."
        // );
      } else {
        //console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      return res.status(201).json({
        message: "Especialidad agregada exitosamente",
        claveespecialidad: insertedClave,
      });
    } catch (error) {
      if (error.message.includes("duplicate key row")) {
        return res
          .status(409)
          .json({ message: "Ya existe una especialidad con este nombre." });
      }
      return res.status(500).json({
        message: "Error al agregar la especialidad",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }
}
