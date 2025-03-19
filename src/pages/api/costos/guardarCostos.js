import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { costo, numeroFactura } = req.body;
    const { claveconsulta } = req.query;

    //* Validaciones de datos
    if (!claveconsulta) {
      return res
        .status(400)
        .json({ message: "Falta la claveconsulta en la petición." });
    }
    if (costo === undefined || numeroFactura === undefined) {
      return res.status(400).json({
        message:
          "Faltan datos: costo o numeroFactura no fueron proporcionados.",
      });
    }

    //* Conexión a la base de datos
    const pool = await connectToDatabase();

    //* Actualización en la tabla "costos" con OUTPUT para capturar el id_gasto actualizado
    const updateQuery = `
      UPDATE costos
      SET costo = @costo,
          factura = @factura,
          fecha = GETDATE(),
          iddocumento = 2
      OUTPUT INSERTED.id_gasto AS idGasto
      WHERE claveconsulta = @claveconsulta
    `;

    const updateResult = await pool
      .request()
      .input("costo", sql.Decimal(10, 2), costo)
      .input("factura", sql.VarChar(50), numeroFactura)
      .input("claveconsulta", sql.Int, Number(claveconsulta))
      .query(updateQuery);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({
        message:
          "No se encontró ningún registro con la claveconsulta proporcionada.",
      });
    }

    //* Obtener el id_gasto del registro actualizado
    const idGasto = updateResult.recordset[0].idGasto;
    console.log("Costo actualizado. id_gasto obtenido:", idGasto);

    //* Registrar la actividad usando el id_gasto obtenido
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuarioInt = claveusuarioCookie
      ? Number(claveusuarioCookie)
      : null;
    console.log("Cookie claveusuario:", claveusuarioInt);

    if (claveusuarioInt !== null) {
      let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);

      const userAgent = req.headers["user-agent"] || "";
      await pool
        .request()
        .input("userId", sql.Int, claveusuarioInt)
        .input("accion", sql.VarChar, "Capturó un Gasto y Factura")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("idGasto", sql.Int, idGasto).query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdGasto)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idGasto)
        `);
      console.log(
        "Actividad 'Capturó un pase de especialidad' registrada en ActividadUsuarios."
      );
    } else {
      console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    return res.status(200).json({
      message:
        "Costo actualizado correctamente en la tabla 'costos' y actividad registrada.",
      idGasto,
    });
  } catch (error) {
    console.error("Error al actualizar el costo:", error);
    return res.status(500).json({
      message: "Error al actualizar el costo en la base de datos.",
    });
  }
}
