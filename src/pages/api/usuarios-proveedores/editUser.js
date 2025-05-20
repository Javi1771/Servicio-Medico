import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    usuarioOriginal,
    usuario,
    nombreproveedor,
    direccionproveedor,
    coloniaproveedor,
    telefonoproveedor,
    celularproveedor,
    cedulaproveedor,
    claveespecialidad,
    clavetipousuario,
    password,
    costo,
    claveproveedor
  } = req.body;

  //* Validaciones mínimas
  if (!usuarioOriginal) {
    return res.status(400).json({
      message: "Falta el usuarioOriginal para localizar el registro.",
    });
  }
  if (!usuario) {
    return res.status(400).json({
      message: "Falta el campo usuario (nuevo).",
    });
  }
  if (!claveespecialidad || !clavetipousuario) {
    return res
      .status(400)
      .json({ message: "Faltan la clave de especialidad o tipo de usuario." });
  }

  try {
    //* Conexión a la base de datos
    const pool = await connectToDatabase();

    //* Preparar la petición de actualización
    const request = pool
      .request()
      .input("nombreproveedor", sql.VarChar, nombreproveedor)
      .input("direccionproveedor", sql.VarChar, direccionproveedor)
      .input("coloniaproveedor", sql.VarChar, coloniaproveedor)
      .input("telefonoproveedor", sql.VarChar, telefonoproveedor)
      .input("celularproveedor", sql.VarChar, celularproveedor)
      .input("cedulaproveedor", sql.VarChar, cedulaproveedor)
      .input("claveespecialidad", sql.Int, claveespecialidad)
      .input("clavetipousuario", sql.Int, clavetipousuario)
      .input("usuario", sql.VarChar, usuario)
      .input("claveproveedor", sql.Int, claveproveedor);

    //* Agregar costo si está definido
    if (typeof costo !== "undefined") {
      request.input("costo", sql.Decimal, costo);
    }

    //* Definir la cláusula SET común a todos
    let setClause = `
      nombreproveedor   = @nombreproveedor,
      direccionproveedor= @direccionproveedor,
      coloniaproveedor  = @coloniaproveedor,
      telefonoproveedor = @telefonoproveedor,
      celularproveedor  = @celularproveedor,
      cedulaproveedor   = @cedulaproveedor,
      claveespecialidad = @claveespecialidad,
      clavetipousuario  = @clavetipousuario,
      usuario           = @usuario
    `;

    if (typeof costo !== "undefined") {
      setClause += `, costo = @costo`;
    }

    let query;
    if (password && password.trim() !== "") {
      request.input("password", sql.VarChar, password);
      query = `
        UPDATE proveedores
          SET ${setClause},
              password = @password
        WHERE claveproveedor = @claveproveedor
      `;
    } else {
      query = `
        UPDATE proveedores
          SET ${setClause}
        WHERE claveproveedor = @claveproveedor
      `;
    }

    //* Ejecutar la consulta de actualización
    await request.query(query);

    //* Obtener el id del proveedor actualizado usando el nuevo valor de "usuario"
    const selectResult = await pool
      .request()
      .input("usuario", sql.VarChar, usuario)
      .query(`SELECT claveproveedor FROM proveedores WHERE usuario = @usuario`);

    if (!selectResult.recordset.length) {
      return res
        .status(404)
        .json({ message: "Proveedor no encontrado tras la actualización." });
    }

    const idProveedor = selectResult.recordset[0].claveproveedor;
    //console.log("Proveedor actualizado, id:", idProveedor);

    //* Registrar la actividad "Editó un proveedor"
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
        .input("accion", sql.VarChar, "Editó un proveedor")
        .input("direccionIP", sql.VarChar, ip)
        .input("agenteUsuario", sql.VarChar, userAgent)
        .input("idProveedor", sql.Int, idProveedor)
        .query(`
          INSERT INTO dbo.ActividadUsuarios 
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdProveedor)
          VALUES 
            (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idProveedor)
        `);
      //console.log("Actividad 'Editó un proveedor' registrada en ActividadUsuarios.");
    } else {
      //console.log("No se pudo registrar la actividad: falta claveusuario.");
    }

    return res
      .status(200)
      .json({ message: "Proveedor actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el proveedor:", error);
    return res.status(500).json({
      message: "Error al actualizar el proveedor",
      error: error.message,
    });
  }
}
