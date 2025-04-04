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

    //* Parsear las cookies para obtener el valor de 'claveusuario'
    const allCookies = cookie.parse(req.headers.cookie || "");
    const cancelo = allCookies.claveusuario; //* Valor que se usará para la columna "cancelo"

    //* Primero, obtener el FOLIO_ORDEN_LABORATORIO del registro activo en LABORATORIOS
    const labRecord = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(`
        SELECT FOLIO_ORDEN_LABORATORIO 
        FROM LABORATORIOS 
        WHERE CLAVECONSULTA = @folio AND ESTATUS = 1
      `);

    if (!labRecord.recordset.length) {
      return res.status(404).json({ message: "Orden de laboratorio no encontrada." });
    }

    const lab = labRecord.recordset[0];
    const folioOrden = lab.FOLIO_ORDEN_LABORATORIO;

    //* Actualizar el registro de LABORATORIOS: ESTATUS = 0 y actualizar "cancelo"
    await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .input("cancelo", sql.VarChar, cancelo)
      .query(`
        UPDATE LABORATORIOS 
        SET ESTATUS = 0, cancelo = @cancelo 
        WHERE CLAVECONSULTA = @folio
      `);

    //* Registrar la actividad de cancelación en ActividadUsuarios, incluyendo el FolioLaboratorio
    try {
      const ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      //* Definir el mensaje de actividad (para laboratorio)
      const accion = "Canceló una orden de laboratorio";

      if (cancelo) {
        await pool
          .request()
          .input("userId", sql.Int, parseInt(cancelo, 10))
          .input("accion", sql.VarChar, accion)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
          .input("claveConsulta", sql.Int, parseInt(folio, 10))
          .input("FolioLaboratorio", sql.VarChar, String(folioOrden))
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, FolioLaboratorio)
            VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @FolioLaboratorio)
          `);
        console.log("Actividad de cancelación registrada.");
      } else {
        console.log("Cookie 'claveusuario' no encontrada; actividad no registrada.");
      }
    } catch (errorRegistro) {
      console.error("Error registrando actividad de cancelación:", errorRegistro);
    }

    return res.status(200).json({ message: "Orden de laboratorio cancelada correctamente." });
  } catch (error) {
    console.error("Error al cancelar la orden de laboratorio:", error);
    return res.status(500).json({
      message: "Error al cancelar la orden de laboratorio",
      error: error.message,
    });
  }
}
