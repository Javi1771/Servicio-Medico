import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      nombreproveedor,
      direccionproveedor,
      coloniaproveedor,
      telefonoproveedor,
      celularproveedor,
      cedulaproveedor,
      claveespecialidad,
      usuario,
      password,
      clavetipousuario,
      costo,
    } = req.body;

    try {
      const pool = await connectToDatabase();

      //* Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      //* Insertar el proveedor y obtener la claveproveedor generada mediante OUTPUT
      const insertResult = await pool
        .request()
        .input("nombreproveedor", sql.VarChar, nombreproveedor)
        .input("direccionproveedor", sql.VarChar, direccionproveedor)
        .input("coloniaproveedor", sql.VarChar, coloniaproveedor)
        .input("telefonoproveedor", sql.VarChar, telefonoproveedor)
        .input("celularproveedor", sql.VarChar, celularproveedor)
        .input("cedulaproveedor", sql.VarChar, cedulaproveedor)
        .input("claveespecialidad", sql.Int, claveespecialidad)
        .input("usuario", sql.VarChar, usuario)
        .input("password", sql.VarChar, hashedPassword)
        .input("clavetipousuario", sql.Int, clavetipousuario)
        .input("activo", sql.VarChar, "S")
        .input("costo", sql.Money, costo).query(`
          INSERT INTO proveedores 
            (nombreproveedor, direccionproveedor, coloniaproveedor, telefonoproveedor, celularproveedor, cedulaproveedor, claveespecialidad, usuario, password, clavetipousuario, activo, costo)
          OUTPUT INSERTED.claveproveedor
          VALUES 
            (@nombreproveedor, @direccionproveedor, @coloniaproveedor, @telefonoproveedor, @celularproveedor, @cedulaproveedor, @claveespecialidad, @usuario, @password, @clavetipousuario, @activo, @costo)
        `);

      //* Se asume que el resultado devuelve la clave en recordset[0].claveproveedor
      const insertedId = insertResult.recordset[0].claveproveedor;
      //console.log("Proveedor insertado, claveproveedor:", insertedId);

      //* Registrar la actividad "Agregó un nuevo proveedor"
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
          .input("accion", sql.VarChar, "Agregó un nuevo proveedor")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("idProveedor", sql.Int, insertedId).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdProveedor)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idProveedor)
          `);
        //console.log(
        //   "Actividad 'Agregó un nuevo proveedor' registrada en ActividadUsuarios."
        // );
      } else {
        //console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      return res.status(201).json({
        message: "Proveedor agregado exitosamente",
        claveproveedor: insertedId,
      });
    } catch (error) {
      console.error("Error al agregar el proveedor:", error);
      return res.status(500).json({
        message: "Error al agregar el proveedor",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} no permitido`);
  }
}
