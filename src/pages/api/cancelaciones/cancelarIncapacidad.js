import sql from "mssql";
import cookie from "cookie";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    //? 1. Obtener la cookie 'claveusuario' para saber quién cancela
    const allCookies = cookie.parse(req.headers.cookie || "");
    const cancelo = allCookies.claveusuario || null;

    //? 2. Buscar el registro de incapacidades para obtener la claveincapacidad
    //*    Filtra el que coincida con la claveconsulta (folio) y estatus=1 (o estatus=1 si así se requiere)
    const incapRecord = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT claveincapacidad
        FROM incapacidades
        WHERE claveconsulta = @folio
          AND estatus = 1
      `);

    if (!incapRecord.recordset.length) {
      return res.status(404).json({
        message: "No se encontró la incapacidad activa con ese folio.",
      });
    }

    const claveIncapacidad = incapRecord.recordset[0].claveincapacidad;

    //? 3. Actualizar la tabla incapacidades: estatus=0 y cancelo=[cookie]
    await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .input("cancelo", sql.VarChar, cancelo)
      .query(`
        UPDATE incapacidades
        SET estatus = 0,
            cancelo = @cancelo
        WHERE claveconsulta = @folio
          AND estatus = 1
      `);

    //? 4. Registrar la actividad de cancelación en la tabla ActividadUsuarios
    //*    Se incluye el FolioIncapacidad con la claveincapacidad obtenida
    try {
      const ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const accion = "Canceló una incapacidad";

      if (cancelo) {
        await pool
          .request()
          .input("userId", sql.Int, parseInt(cancelo, 10))
          .input("accion", sql.VarChar, accion)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
          .input("claveConsulta", sql.Int, parseInt(folio, 10))
          .input("FolioIncapacidad", sql.Int, parseInt(claveIncapacidad, 10))
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, FolioIncapacidad)
            VALUES
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @FolioIncapacidad)
          `);
        //console.log("Actividad de cancelación registrada en la tabla ActividadUsuarios.");
      } else {
        //console.log("Cookie 'claveusuario' no encontrada; actividad no registrada.");
      }
    } catch (errorRegistro) {
      console.error("Error registrando actividad de cancelación:", errorRegistro);
    }

    return res.status(200).json({ message: "Incapacidad cancelada correctamente." });
  } catch (error) {
    console.error("Error al cancelar incapacidad:", error);
    return res.status(500).json({
      message: "Error al cancelar la incapacidad",
      error: error.message,
    });
  }
}
