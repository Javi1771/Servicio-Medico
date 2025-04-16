import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveespecialidad } = req.body;

  //console.log("Valor recibido para claveespecialidad:", claveespecialidad);

  // Validación: se requiere que claveespecialidad sea un número válido
  if (!claveespecialidad || isNaN(claveespecialidad)) {
    console.error("Error: claveespecialidad debe ser un número válido.");
    return res
      .status(400)
      .json({ message: "Clave de especialidad debe ser un número válido" });
  }

  try {
    const pool = await connectToDatabase();

    // console.log(
    //   `Ejecutando UPDATE para desactivar la especialidad con clave: ${claveespecialidad}`
    // );

    // Actualizar la especialidad: se marca como inactiva (estatus = 0)
    const result = await pool
      .request()
      .input("claveespecialidad", sql.Int, claveespecialidad).query(`
        UPDATE especialidades
        SET estatus = 0
        WHERE claveespecialidad = @claveespecialidad
      `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Especialidad no encontrada o sin cambios" });
    }

    // Registrar la actividad "Eliminó una especialidad"
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie ? Number(claveusuarioCookie) : null;
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
        .input("accion", sql.VarChar, "Eliminó una especialidad")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        // Se quitan los campos de beneficiario y claveconsulta: se guardan como null
        .input("claveConsulta", sql.Int, null)
        .input("idBeneficiario", sql.Int, null)
        .input("idEspecialidad", sql.Int, claveespecialidad).query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario, IdEspecialidad)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario, @idEspecialidad)
        `);
      // console.log(
      //   "Actividad 'Eliminó una especialidad' registrada en ActividadUsuarios."
      // );
    } else {
      //console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    return res
      .status(200)
      .json({ message: "Especialidad eliminada correctamente" });
  } catch (error) {
    console.error("Error al desactivar la especialidad:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
}
