import sql from "mssql";
import cookie from "cookie";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioOrden } = req.body;
  if (!folioOrden) {
    //console.log("❌ No se recibió el folioOrden del frontend.");
    return res.status(400).json({ message: "Folio de orden de laboratorio requerido." });
  }

  //console.log("📩 Folio recibido del frontend:", folioOrden);

  try {
    const pool = await connectToDatabase();

    //* Obtener cookie
    const allCookies = cookie.parse(req.headers.cookie || "");
    const cancelo = allCookies.claveusuario;

    //console.log("🔐 Usuario que cancela (claveusuario):", cancelo);

    //* Buscar la orden
    const labRecord = await pool
      .request()
      .input("folioOrden", sql.Int, parseInt(folioOrden, 10))
      .query(`
        SELECT CLAVECONSULTA 
        FROM LABORATORIOS 
        WHERE FOLIO_ORDEN_LABORATORIO = @folioOrden AND ESTATUS = 1
      `);

    if (!labRecord.recordset.length) {
      //console.log("❌ No se encontró ninguna orden activa con ese folio.");
      return res.status(404).json({ message: "Orden de laboratorio no encontrada." });
    }

    const folioConsulta = labRecord.recordset[0].CLAVECONSULTA;
    //console.log("📄 Orden encontrada. ClaveConsulta relacionada:", folioConsulta);

    //* Actualizar el estatus de la orden
    await pool
      .request()
      .input("folioOrden", sql.Int, parseInt(folioOrden, 10))
      .input("cancelo", sql.VarChar, cancelo)
      .query(`
        UPDATE LABORATORIOS 
        SET ESTATUS = 0, cancelo = @cancelo 
        WHERE FOLIO_ORDEN_LABORATORIO = @folioOrden
      `);

    //console.log(`✅ Orden con folio ${folioOrden} actualizada correctamente.`);

    //* Registrar actividad
    try {
      const ip =
        (req.headers["x-forwarded-for"] && req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const accion = "Canceló una orden de laboratorio";

      if (cancelo) {
        await pool
          .request()
          .input("userId", sql.Int, parseInt(cancelo, 10))
          .input("accion", sql.VarChar, accion)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
          .input("claveConsulta", sql.Int, parseInt(folioConsulta, 10))
          .input("FolioLaboratorio", sql.VarChar, String(folioOrden))
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, FolioLaboratorio)
            VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @FolioLaboratorio)
          `);
        //console.log("📝 Actividad registrada en el historial.");
      } else {
        //console.log("⚠️ No se encontró la cookie 'claveusuario'. No se registró actividad.");
      }
    } catch (errorRegistro) {
      console.error("❌ Error al registrar la actividad:", errorRegistro);
    }

    return res.status(200).json({ message: "Orden de laboratorio cancelada correctamente." });
  } catch (error) {
    console.error("❌ Error al cancelar la orden de laboratorio:", error);
    return res.status(500).json({
      message: "Error al cancelar la orden de laboratorio",
      error: error.message,
    });
  }
}
