import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { usuario } = req.query;

  if (!usuario) {
    return res.status(400).json({ message: "Usuario no proporcionado" });
  }

  try {
    const pool = await connectToDatabase();

    //* Actualizar el proveedor: marcarlo como inactivo (activo = 'N')
    const updateResult = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query("UPDATE proveedores SET activo = 'N' WHERE usuario = @usuario");

    if (updateResult.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Proveedor no encontrado o sin cambios" });
    }

    //* Recuperar la claveproveedor del registro actualizado
    const selectResult = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query("SELECT claveproveedor FROM proveedores WHERE usuario = @usuario");

    if (!selectResult.recordset.length) {
      return res.status(404).json({
        message: "Proveedor no encontrado después de la actualización",
      });
    }

    const idProveedor = selectResult.recordset[0].claveproveedor;
    //console.log("Proveedor desactivado, claveproveedor:", idProveedor);

    //* Registrar la actividad "Eliminó un proveedor"
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
        .input("accion", sql.VarChar, "Eliminó un proveedor")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("idProveedor", sql.Int, idProveedor).query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdProveedor)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idProveedor)
        `);
      //console.log(
      //   "Actividad 'Eliminó un proveedor' registrada en ActividadUsuarios."
      // );
    } else {
      //console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    return res
      .status(200)
      .json({ message: "Proveedor desactivado correctamente" });
  } catch (error) {
    console.error("Error al desactivar el proveedor:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
}
