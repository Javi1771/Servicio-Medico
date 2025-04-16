import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { id_enf_cronica, kpi } = req.body;

    if (!id_enf_cronica || !kpi) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos." });
    }

    try {
      const pool = await connectToDatabase();

      //* Insertar el KPI y obtener el id_kpi generado mediante OUTPUT
      const insertResult = await pool
        .request()
        .input("id_enf_cronica", sql.Int, id_enf_cronica)
        .input("kpi", sql.VarChar, kpi)
        .input("estatus", sql.Bit, 1).query(`
          INSERT INTO KPIs (id_enf_cronica, kpi, estatus)
          OUTPUT INSERTED.id_kpi
          VALUES (@id_enf_cronica, @kpi, @estatus)
        `);

      const insertedId = insertResult.recordset[0].id_kpi;
      //console.log("KPI registrado, id_kpi:", insertedId);

      //* Registrar la actividad "Agregó un nuevo KPI"
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
          .input("accion", sql.VarChar, "Agregó un nuevo KPI")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          //* Se envían null para los campos que no corresponden
          .input("idKPI", sql.Int, insertedId).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdKPI)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idKPI)
          `);
        // console.log(
        //   "Actividad 'Agregó un nuevo KPI' registrada en ActividadUsuarios."
        // );
      } else {
        //console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      return res
        .status(201)
        .json({ message: "KPI registrado exitosamente.", id_kpi: insertedId });
    } catch (error) {
      console.error("Error al registrar KPI:", error);
      return res.status(500).json({ message: "Error al registrar el KPI." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }
}
