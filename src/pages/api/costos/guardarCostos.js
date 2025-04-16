import fs from "fs";
import path from "path";
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import formidable from "formidable";

//* Desactivar el bodyParser para procesar multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    //console.log("Método no permitido:", req.method);
    return res.status(405).json({ message: "Método no permitido" });
  }

  //* Configurar formidable para conservar extensiones y escribir en un directorio temporal
  const uploadTmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadTmpDir)) {
    fs.mkdirSync(uploadTmpDir, { recursive: true });
  }
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    uploadDir: uploadTmpDir,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error al parsear el formulario:", err);
      return res.status(500).json({ message: "Error al parsear el formulario" });
    }

    //console.log("Campos recibidos:", fields);
    //console.log("Archivos recibidos:", files);
    //console.log("Query string:", req.query);

    try {
      const { costo, numeroFactura } = fields;
      const { claveconsulta } = req.query;

      if (!claveconsulta) {
        console.error("No se recibió claveconsulta.");
        return res
          .status(400)
          .json({ message: "Falta la claveconsulta en la petición." });
      }
      if (costo === undefined || numeroFactura === undefined) {
        console.error("Faltan datos: costo o numeroFactura:", { costo, numeroFactura });
        return res.status(400).json({
          message: "Faltan datos: costo o numeroFactura no fueron proporcionados.",
        });
      }

      if (!files.pdfEvidence || files.pdfEvidence.size <= 0) {
        console.error("No se recibió un archivo PDF válido.");
        return res.status(400).json({
          message: "Debe enviar un archivo PDF válido para continuar.",
        });
      }

      //* Si pdfEvidence es un array, tomar el primero
      let pdfFile = files.pdfEvidence;
      if (Array.isArray(pdfFile)) {
        pdfFile = pdfFile[0];
      }

      const pool = await connectToDatabase();
      //console.log("Conexión a la base de datos exitosa");
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      //console.log("Transacción iniciada");

      try {
        const request = new sql.Request(transaction);
        const updateQuery = `
          UPDATE costos
          SET costo = @costo,
              factura = @factura,
              fecha = GETDATE(),
              iddocumento = 2
          OUTPUT INSERTED.id_gasto AS idGasto
          WHERE claveconsulta = @claveconsulta
        `;
        //console.log("Query de actualización:", updateQuery);
        //console.log("Parámetros de actualización:", { costo, factura: numeroFactura ? numeroFactura.toString() : "", claveconsulta: Number(claveconsulta), });
        const updateResult = await request
          .input("costo", sql.Decimal(10, 2), costo)
          .input("factura", sql.VarChar(50), numeroFactura ? numeroFactura.toString() : "")
          .input("claveconsulta", sql.Int, Number(claveconsulta))
          .query(updateQuery);

        if (updateResult.recordset.length === 0) {
          console.error("No se encontró registro para claveconsulta:", claveconsulta);
          try {
            await transaction.rollback();
          } catch (rollbackError) {
            console.error("Error al hacer rollback:", rollbackError);
          }
          return res.status(404).json({
            message:
              "No se encontró ningún registro con la claveconsulta proporcionada.",
          });
        }

        const idGasto = updateResult.recordset[0].idGasto;
        //console.log("Costo actualizado. id_gasto obtenido:", idGasto);

        //* Procesar el archivo PDF
        const sourcePath = pdfFile.filepath || pdfFile.path;
        //console.log("Ruta del archivo recibido:", sourcePath);
        if (!sourcePath) {
          console.error("No se encontró la ruta del archivo subido.");
          try {
            await transaction.rollback();
          } catch (rollbackError) {
            console.error("Error al hacer rollback:", rollbackError);
          }
          return res.status(400).json({
            message: "No se encontró la ruta del archivo subido.",
          });
        }

        //* Obtener 'clavenomina'
        let claveNominaFinal = fields.clavenomina;
        if (!claveNominaFinal) {
          const selectQuery = `SELECT clavenomina FROM costos WHERE id_gasto = @idGasto`;
          //console.log("Query para obtener clavenomina:", selectQuery);
          const selectResult = await request.input("idGasto", sql.Int, idGasto).query(selectQuery);
          //console.log("Resultado de clavenomina:", selectResult.recordset);
          if (selectResult.recordset.length > 0) {
            claveNominaFinal = selectResult.recordset[0].clavenomina;
          } else {
            claveNominaFinal = "undefined";
          }
        }
        //console.log("Valor de clavenomina a usar:", claveNominaFinal);

        const fileName = `${idGasto}_${claveNominaFinal}.pdf`;
        //console.log("Nombre de archivo generado:", fileName);

        const folderPath = path.join(process.cwd(), "public", "facturas");
        //console.log("Carpeta destino:", folderPath);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
          //console.log("Carpeta creada:", folderPath);
        }
        const filePath = path.join(folderPath, fileName);
        //console.log("Ruta completa para guardar el archivo:", filePath);

        fs.renameSync(sourcePath, filePath);
        //console.log("Archivo movido a:", filePath);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
        const urlFactura = `${baseUrl}/facturas/${fileName}`;
        //console.log("URL que se guardará en la BD:", urlFactura);

        const updateUrlQuery = `UPDATE costos SET url_factura = @urlFactura WHERE id_gasto = @idGasto`;
        //console.log("Query para actualizar url_factura:", updateUrlQuery);
        //console.log("Parámetros para actualizar url_factura:", { urlFactura, idGasto });

        //* Usar un nuevo objeto Request para evitar duplicidad de parámetros
        const requestUrl = new sql.Request(transaction);
        await requestUrl
          .input("urlFactura", sql.VarChar(255), urlFactura)
          .input("idGasto", sql.Int, idGasto)
          .query(updateUrlQuery);
        //console.log("url_factura actualizada en la BD.");

        await transaction.commit();
        //console.log("Transacción commit exitosa.");

        //* Registrar la actividad (fuera de la transacción)
        const rawCookies = req.headers.cookie || "";
        const claveusuarioCookie = rawCookies.split("; ").find((row) => row.startsWith("claveusuario="))?.split("=")[1];
        const claveusuarioInt = claveusuarioCookie ? Number(claveusuarioCookie) : null;
        //console.log("Cookie claveusuario:", claveusuarioInt);

        if (claveusuarioInt !== null) {
          let ip = (req.headers["x-forwarded-for"] && req.headers["x-forwarded-for"].split(",")[0].trim()) ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   (req.connection?.socket ? req.connection.socket.remoteAddress : null);
          const userAgent = req.headers["user-agent"] || "";
          const actividadQuery = `
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdGasto)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @idGasto)
          `;
          //console.log("Query para registrar actividad:", actividadQuery);
          //console.log("Parámetros de actividad:", { userId: claveusuarioInt, accion: "Capturó un Gasto y Factura", direccionIP: ip, agenteUsuario: userAgent , idGasto });
          await pool
            .request()
            .input("userId", sql.Int, claveusuarioInt)
            .input("accion", sql.VarChar, "Capturó un Gasto y Factura")
            .input("direccionIP", sql.VarChar, ip)
            .input("agenteUsuario", sql.VarChar, userAgent)
            .input("idGasto", sql.Int, idGasto)
            .query(actividadQuery);
          //console.log("Actividad registrada en ActividadUsuarios.");
        } else {
          //console.log("No se pudo registrar la actividad: falta claveusuario.");
        }

        return res.status(200).json({
          message: "Costo actualizado correctamente en la tabla 'costos' y actividad registrada.",
          idGasto,
        });
      } catch (error) {
        try {
          await transaction.rollback();
          console.error("Rollback de transacción efectuado.");
        } catch (rollbackError) {
          console.error("Error al hacer rollback:", rollbackError);
        }
        console.error("Error al actualizar el costo:", error);
        return res.status(500).json({ message: "Error al actualizar el costo en la base de datos." });
      }
    } catch (error) {
      console.error("Error al actualizar el costo:", error);
      return res.status(500).json({ message: "Error al actualizar el costo en la base de datos." });
    }
  });
}
