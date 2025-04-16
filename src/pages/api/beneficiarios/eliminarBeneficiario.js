import { connectToDatabase } from "../connectToDatabase";
import cloudinary from "../../../lib/cloudinaryServer";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    // Desestructuramos ambos valores del body
    // motivEliminacion será el texto que el usuario ingresa
    const { idBeneficiario, motivoEliminacion } = req.body;

    if (!idBeneficiario) {
      return res.status(400).json({ error: "Falta el ID del beneficiario" });
    }

    try {
      const pool = await connectToDatabase();

      //* 1) Obtener la URL de la imagen del beneficiario
      const imageResult = await pool
        .request()
        .input("idBeneficiario", sql.Int, idBeneficiario)
        .query(
          "SELECT FOTO_URL FROM BENEFICIARIO WHERE ID_BENEFICIARIO = @idBeneficiario"
        );

      if (imageResult.recordset.length === 0) {
        return res.status(404).json({ error: "Beneficiario no encontrado" });
      }

      const { FOTO_URL } = imageResult.recordset[0];

      //! 2) Eliminar la imagen de Cloudinary si existe
      if (FOTO_URL) {
        const publicId = extractCloudinaryPublicId(FOTO_URL);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
          //console.log(`Imagen eliminada de Cloudinary: ${publicId}`);
        }
      }

      //* 3) Actualizar el campo ACTIVO a 'I' (inactivo) y almacenar el MOTIVO
      //    Asegúrate de que la columna MOTIVO exista en tu tabla BENEFICIARIO
      //    y tenga tipo VARCHAR/ NVARCHAR (dependiendo de lo que uses).
      const updateResult = await pool
        .request()
        .input("idBeneficiario", sql.Int, idBeneficiario)
        .input("motivoEliminacion", sql.VarChar(255), motivoEliminacion || "") 
        .query(`
          UPDATE BENEFICIARIO 
             SET ACTIVO = 'I',
                 MOTIVO = @motivoEliminacion
           WHERE ID_BENEFICIARIO = @idBeneficiario
        `);

      if (updateResult.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Beneficiario no encontrado" });
      }

      //* 4) Registrar la actividad "Eliminó un beneficiario" en tu tabla de logs
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
          .input("accion", sql.VarChar, "Eliminó un beneficiario")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, null)
          .input("idBeneficiario", sql.Int, idBeneficiario)
          .query(`
            INSERT INTO ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta, IdBeneficiario)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta, @idBeneficiario)
          `);

        //console.log("Actividad 'Eliminó un beneficiario' registrada en ActividadUsuarios." );
      } else {
        //console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      return res.status(200).json({
        message:
          "Beneficiario marcado como inactivo, su imagen eliminada y actividad registrada correctamente",
      });
    } catch (error) {
      console.error(
        "Error al realizar el borrado lógico del beneficiario:",
        error
      );
      return res.status(500).json({
        error: "Error al realizar el borrado lógico del beneficiario",
      });
    }
  } else {
    return res.status(405).json({ message: "Método no permitido" });
  }
}

//* Función para extraer el `public_id` de la URL de Cloudinary
function extractCloudinaryPublicId(imageUrl) {
  const regex = /\/([^\/]*)\.[a-zA-Z]{3,4}$/;
  const match = imageUrl.match(regex);
  return match ? match[1] : null;
}
