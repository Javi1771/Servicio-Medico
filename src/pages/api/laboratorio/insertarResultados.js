import fs from "fs";
import path from "path";
import formidable from "formidable";
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//! Desactivamos el body parser de Next.js para manejar "multipart/form-data" con formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido, usa POST" });
  }

  try {
    //* Instanciamos formidable sin "new" ni IncomingForm
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parseando el form-data:", err);
        return res.status(500).json({ error: "Error parseando el form-data" });
      }

      //* Extraer y asegurar que los campos sean strings
      const safeFolio =
        Array.isArray(fields.folio) ? fields.folio[0] : fields.folio;
      const safeNomina =
        Array.isArray(fields.nomina) ? fields.nomina[0] : fields.nomina;
      let fileObject = files.pdf; //* Campo 'pdf'

      if (!safeFolio || !safeNomina || !fileObject) {
        return res.status(400).json({
          error: "Faltan parámetros (folio, nomina) o archivo PDF",
        });
      }

      //* Si el archivo se recibió como array, tomamos el primero
      if (Array.isArray(fileObject)) {
        fileObject = fileObject[0];
      }

      //* Obtenemos la ruta temporal (fileObject.filepath o fileObject.path)
      const tempPath = fileObject.filepath || fileObject.path;
      if (!tempPath) {
        console.error("No se encontró la ruta temporal en el archivo:", fileObject);
        return res.status(400).json({ error: "Archivo no tiene ruta temporal" });
      }

      //? 1) Creamos la carpeta 'estudios' en public (única) si no existe
      const estudiosDir = path.join(process.cwd(), "public", "estudios");
      if (!fs.existsSync(estudiosDir)) {
        fs.mkdirSync(estudiosDir);
      }

      //? 2) Construimos el nombre final del PDF: "[folio]_[nomina].pdf"
      const finalFileName = `${safeFolio}_${safeNomina}.pdf`;

      //? 3) Copiamos el archivo desde la ruta temporal a la carpeta "estudios"
      const newFilePath = path.join(estudiosDir, finalFileName);
      fs.copyFileSync(tempPath, newFilePath);
      //! Eliminamos el archivo en la ubicación temporal
      fs.unlinkSync(tempPath);

      //? 4) Generamos la URL completa a guardar en la BD.
      //* Se utiliza process.env.BASE_URL para tener una URL base.
      //* Si no se define, se construye a partir de las cabeceras de la petición.
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
      const fullUrl = `${baseUrl}/estudios/${finalFileName}`;

      //? 5) Actualizamos la BD: LABORATORIOS.URL_RESULTADOS
      const pool = await connectToDatabase();
      const updateQuery = `
        UPDATE LABORATORIOS
        SET URL_RESULTADOS = @url
        WHERE FOLIO_ORDEN_LABORATORIO = @folio
      `;
      await pool
        .request()
        .input("url", sql.VarChar, fullUrl)
        .input("folio", sql.Int, safeFolio)
        .query(updateQuery);

      //? 6) Registrar la actividad en la tabla ActividadUsuarios
      const rawCookies = req.headers.cookie || "";
      const claveusuarioCookie = rawCookies
        .split("; ")
        .find((row) => row.startsWith("claveusuario="))
        ?.split("=")[1];
      const claveusuarioInt = claveusuarioCookie ? Number(claveusuarioCookie) : null;

      if (claveusuarioInt !== null) {
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket
            ? req.connection.socket.remoteAddress
            : null);

        const userAgent = req.headers["user-agent"] || "";

        const actividadQuery = `
          INSERT INTO dbo.ActividadUsuarios
            (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdLaboratorio)
          VALUES
            (@userId, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idLaboratorio)
        `;
        await pool
          .request()
          .input("userId", sql.Int, claveusuarioInt)
          .input("accion", sql.VarChar, "Subió resultados de laboratorio")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("idLaboratorio", sql.Int, safeFolio)
          .query(actividadQuery);
      }

      return res.status(200).json({
        message: "Archivo subido y ruta guardada correctamente.",
        urlGuardada: fullUrl,
      });
    });
  } catch (error) {
    console.error("Error en subirResultado:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
