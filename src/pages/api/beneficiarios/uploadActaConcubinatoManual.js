import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Deshabilitamos el bodyParser para usar formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error al parsear el formulario:", err);
      return res.status(500).json({ error: "Error al procesar el archivo." });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let { numNomina } = fields;

    // Asegurarse de que numNomina sea una cadena
    if (Array.isArray(numNomina)) {
      numNomina = numNomina[0];
    }

    if (!file) {
      return res.status(400).json({ error: "No se recibió ningún archivo en la solicitud." });
    }

    if (!numNomina) {
      return res.status(400).json({ error: "El número de nómina es obligatorio." });
    }

    try {
      // Definir la carpeta donde se guardará el archivo: /public/acta_concubinatos/{numNomina}/
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "acta_concubinatos",
        numNomina
      );

      // Crear la carpeta si no existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generar nombre único para el archivo
      const fileName = `acta_concubinato_manual_${Date.now()}${path.extname(file.originalFilename || "")}`;
      const filePath = path.join(uploadDir, fileName);

      // Guardar el archivo en el servidor (mover desde la ubicación temporal)
      fs.renameSync(file.filepath, filePath);

      // Construir la URL final para acceder al archivo
      // Asegúrate de ajustar el puerto según el que use tu servidor
      const finalURL = `${process.env.NEXT_PUBLIC_BASE_URL}/acta_concubinatos/${numNomina}/${fileName}`;

      return res.status(200).json({
        url: finalURL,
        message: "Archivo subido correctamente al servidor propio.",
      });
    } catch (error) {
      console.error("Error al subir el archivo de Concubinato Manual:", error);
      return res.status(500).json({ error: "Error al subir el archivo de Concubinato Manual." });
    }
  });
}
