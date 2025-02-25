import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Deshabilitar bodyParser para usar formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const form = formidable({
    multiples: false, // No permitir múltiples archivos
    keepExtensions: true, // Mantener extensiones de archivo
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error al parsear el formulario:", err);
      return res.status(500).json({ error: "Error al procesar el archivo." });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let { numNomina } = fields; // Obtener el número de nómina del formulario
    if (Array.isArray(numNomina)) {
      numNomina = numNomina[0];
    }

    if (!file) {
      console.error("Archivo no encontrado en la solicitud");
      return res.status(400).json({ error: "Archivo no encontrado en la solicitud." });
    }

    if (!numNomina) {
      console.error("Número de nómina no proporcionado");
      return res.status(400).json({ error: "El número de nómina es obligatorio." });
    }

    try {
      // Definir la carpeta destino: /public/constancias/{numNomina}/
      const uploadDir = path.join(process.cwd(), "public", "constancias", numNomina);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generar un nombre único para el archivo
      const fileName = `constancia_${Date.now()}${path.extname(file.originalFilename || "")}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover el archivo desde la carpeta temporal a la carpeta destino
      fs.renameSync(file.filepath, filePath);

      // Construir la URL final para acceder al archivo.
      // Ajusta el puerto según la configuración de tu servidor.
     const finalURL = `${process.env.NEXT_PUBLIC_BASE_URL}/constancias/${numNomina}/${fileName}`;

      return res.status(200).json({
        url: finalURL,
        message: "Constancia de Estudios subida correctamente al servidor propio.",
      });
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      return res.status(500).json({ error: "Error al subir el archivo. Intenta nuevamente." });
    }
  });
}
