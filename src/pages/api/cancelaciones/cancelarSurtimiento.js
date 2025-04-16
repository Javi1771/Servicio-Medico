import sql from "mssql";
import cookie from "cookie";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;
  if (!folio) {
    //console.log("❌ No se recibió el folio para cancelar el surtimiento.");
    return res.status(400).json({ message: "Folio es requerido." });
  }

  //console.log("📩 Folio recibido:", folio);

  try {
    const pool = await connectToDatabase();

    //* Obtener cookie
    const allCookies = cookie.parse(req.headers.cookie || "");
    const cancelo = allCookies.claveusuario;
    //console.log("🔐 Usuario que cancela (claveusuario):", cancelo);

    //* Actualizar surtimiento: se marca como cancelado (ESTATUS = 0)
    //* y se obtiene el FOLIO_SURTIMIENTO con OUTPUT.
    const result = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        UPDATE SURTIMIENTOS
        SET ESTATUS = 0
        OUTPUT INSERTED.FOLIO_SURTIMIENTO
        WHERE FOLIO_PASE = @folio
      `);

    if (!result.recordset || result.recordset.length === 0) {
      //console.log("❌ No se encontró surtimiento activo con ese folio.");
      return res.status(404).json({ message: "Surtimiento no encontrado." });
    }

    const folioSurtimiento = result.recordset[0].FOLIO_SURTIMIENTO;
    //console.log("📄 Surtimiento actualizado. FolioSurtimiento:", folioSurtimiento);

    //* Registrar actividad
    try {
      const ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const accion = "Canceló un surtimiento";

      if (cancelo) {
        await pool
          .request()
          .input("userId", sql.Int, parseInt(cancelo, 10))
          .input("accion", sql.VarChar, accion)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
          //* En este caso, usamos "folio" del request como referencia en ClaveConsulta.
          .input("claveConsulta", sql.VarChar, folio)
          .input("folioSurtimiento", sql.VarChar, folioSurtimiento)
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, FolioSurtimiento)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @folioSurtimiento)
          `);
        //console.log("📝 Actividad registrada en el historial.");
      } else {
        //console.log("⚠️ No se encontró la cookie 'claveusuario'. No se registró actividad.");
      }
    } catch (errorRegistro) {
      console.error("❌ Error al registrar la actividad:", errorRegistro);
    }

    return res.status(200).json({ message: "Surtimiento cancelado correctamente." });
  } catch (error) {
    console.error("❌ Error al cancelar surtimiento:", error);
    return res.status(500).json({
      message: "Error al cancelar el surtimiento",
      error: error.message,
    });
  }
}
