import sql from "mssql";
import cookie from "cookie";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  //* Se espera que el body tenga folio y tipo
  const { folio, tipo } = req.body;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();

    //* Parseamos las cookies para obtener el valor de 'claveusuario'
    const allCookies = cookie.parse(req.headers.cookie || "");
    const cancelo = allCookies.claveusuario; //* Este valor se usará para actualizar la columna "cancelo"

    //* Actualizamos la consulta:
    //* - clavestatus se pone a 0 para indicar cancelación
    //* - la columna "cancelo" se actualiza con el valor de la cookie
    await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .input("cancelo", sql.VarChar, cancelo)
      .query(
        `UPDATE consultas 
         SET clavestatus = 0, cancelo = @cancelo 
         WHERE claveconsulta = @folio`
      );

    //* Registrar la actividad de cancelación
    try {
      const ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      //* Definimos el mensaje de acción según si es pase o consulta
      let accionMessage = "Canceló una consulta";
      if (tipo === "paseEspecialidad") {
        accionMessage = "Canceló un pase";
      }

      if (cancelo) {
        await pool
          .request()
          .input("userId", sql.Int, parseInt(cancelo, 10))
          .input("accion", sql.VarChar, accionMessage)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
          .input("claveConsulta", sql.Int, parseInt(folio, 10))
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        //console.log("Actividad de cancelación registrada.");
      } else {
        //console.log("Cookie 'claveusuario' no encontrada; actividad no registrada.");
      }
    } catch (errorRegistro) {
      console.error("Error registrando actividad de cancelación:", errorRegistro);
    }

    return res.status(200).json({ message: "Consulta cancelada correctamente." });
  } catch (error) {
    console.error("Error al cancelar consulta:", error);
    return res.status(500).json({
      message: "Error al cancelar la consulta",
      error: error.message,
    });
  }
}
