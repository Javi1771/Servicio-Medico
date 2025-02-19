import cloudinary from "../../../lib/cloudinaryServer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // Deshabilitar bodyParser
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
    const { numNomina } = fields; // Obtener el número de nómina del formulario

    if (!file) {
      console.error("Archivo no encontrado en la solicitud");
      return res
        .status(400)
        .json({ error: "Archivo no encontrado en la solicitud." });
    }

    if (!numNomina) {
      console.error("Número de nómina no proporcionado");
      return res
        .status(400)
        .json({ error: "El número de nómina es obligatorio." });
    }

    try {
      // Definir la carpeta en Cloudinary
      const folderPath = `ine/${numNomina}`;

      // Subir el archivo a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw", // Subir como archivo raw (PDF)
        folder: folderPath, // Carpeta con estructura específica
        use_filename: true, // Usar el nombre original del archivo
        unique_filename: false, // Permitir nombres duplicados
      });

      console.log("Archivo subido exitosamente:", uploadResponse);

      return res.status(200).json({
        url: uploadResponse.secure_url, // URL pública del archivo
      });
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      return res
        .status(500)
        .json({ error: "Error al subir el archivo. Intenta nuevamente." });
    }
  });
}
