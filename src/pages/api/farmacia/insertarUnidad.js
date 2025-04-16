import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función auxiliar para obtener la cookie "claveusuario"
function getUserIdFromCookie(req) {
  const rawCookies = req.headers.cookie || "";
  const cookie = rawCookies
    .split("; ")
    .find((c) => c.startsWith("claveusuario="));
  if (!cookie) return null;

  const claveUsuario = cookie.split("=")[1];
  return claveUsuario ? Number(claveUsuario) : null;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { medida } = req.body;

    //* Validar que se envíe el campo "medida"
    if (!medida) {
      return res
        .status(400)
        .json({ message: "El campo 'medida' es obligatorio." });
    }

    try {
      const pool = await connectToDatabase();

      //* Realizar el INSERT y capturar el id_medida generado con SCOPE_IDENTITY()
      const insertResult = await pool
        .request()
        .input("medida", sql.NVarChar, medida).query(`
          INSERT INTO unidades_de_medida (medida)
          OUTPUT INSERTED.id_medida AS newIdMedida
          VALUES (@medida);
        `);

      //* Tomamos el nuevo id_medida
      const newIdMedida = insertResult.recordset[0].newIdMedida;
      //console.log("Se generó un nuevo id_medida:", newIdMedida);

      //* Registrar la actividad en la tabla ActividadUsuarios
      try {
        const idUsuario = getUserIdFromCookie(req);
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        const userAgent = req.headers["user-agent"] || "";

        if (idUsuario) {
          await pool
            .request()
            .input("IdUsuario", sql.Int, idUsuario)
            .input("Accion", sql.VarChar, "Agregó una nueva unidad de medida")
            .input("DireccionIP", sql.VarChar, ip)
            .input("AgenteUsuario", sql.VarChar, userAgent)
            .input("IdMedida", sql.Int, newIdMedida).query(`
              INSERT INTO ActividadUsuarios
                (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdMedida)
              VALUES
                (@IdUsuario, @Accion, GETDATE(), @DireccionIP, @AgenteUsuario, @IdMedida)
            `);

          //console.log(
          //   "✅ Actividad registrada en la tabla ActividadUsuarios con el IdMedida:",
          //   newIdMedida
          // );
        } else {
          // console.log(
          //   "⚠️ No se pudo registrar la actividad: falta la cookie 'claveusuario'."
          // );
        }
      } catch (activityError) {
        console.error("❌ Error al registrar la actividad:", activityError);
      }

      //* Finalmente, responder al cliente con éxito
      return res
        .status(201)
        .json({ message: "Unidad de medida insertada correctamente." });
    } catch (error) {
      console.error("Error en /api/farmacia/unidades/insert:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Método ${req.method} no permitido.` });
  }
}
