import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

//* Endpoint para editar una especialidad
export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveespecialidad, especialidad } = req.body;

  //* Validación de datos
  if (!claveespecialidad || !especialidad) {
    return res.status(400).json({
      message:
        "Faltan datos requeridos: claveespecialidad y especialidad son obligatorios.",
    });
  }

  try {
    const pool = await connectToDatabase();

    //* Actualizar la especialidad
    const request = pool
      .request()
      .input("claveespecialidad", sql.Int, claveespecialidad)
      .input("especialidad", sql.VarChar, especialidad);

    const query = `
      UPDATE especialidades
      SET especialidad = @especialidad
      WHERE claveespecialidad = @claveespecialidad
    `;
    await request.query(query);

    //* Registrar la actividad "Editó una especialidad"
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
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const userAgent = req.headers["user-agent"] || "";

      await pool
        .request()
        .input("userId", sql.Int, claveusuario)
        .input("accion", sql.VarChar, "Editó una especialidad")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("idEspecialidad", sql.Int, claveespecialidad).query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdEspecialidad)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idEspecialidad)
        `);

      // console.log(
      //   "Actividad 'Editó una especialidad' registrada en ActividadUsuarios."
      // );
    } else {
      //console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    return res
      .status(200)
      .json({ message: "Especialidad actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la especialidad:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
}
