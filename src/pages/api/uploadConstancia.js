import cloudinary from "../../lib/cloudinaryServer";
import formidable from "formidable";

// Desactivar validación SSL (solo para desarrollo)
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

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
      return res.status(500).json({ error: "Error al parsear el formulario" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const { numNomina } = fields; // Obtener el número de nómina del formulario

    if (!file) {
      console.error("Archivo no encontrado en la solicitud");
      return res
        .status(400)
        .json({ error: "Archivo no encontrado en la solicitud" });
    }

    if (!numNomina) {
      console.error("Número de nómina no proporcionado");
      return res
        .status(400)
        .json({ error: "El número de nómina es obligatorio." });
    }

    const filePath = file.filepath;

    try {
      // Definir la carpeta en Cloudinary
      const folderPath = `constancias/${numNomina}`;

      // Subir el archivo a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(filePath, {
        resource_type: "raw", // Para subir archivos PDF
        folder: folderPath, // Carpeta en Cloudinary
        use_filename: true, // Mantener el nombre original del archivo
        unique_filename: false, // Permitir nombres repetidos
      });

      console.log("Archivo subido exitosamente:", uploadResponse);

      // Enviar la URL pública del archivo como respuesta
      return res.status(200).json({
        url: uploadResponse.secure_url, // URL pública para acceder al archivo
      });
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      return res
        .status(500)
        .json({ error: "Error al subir el archivo. Intenta nuevamente." });
    }
  });
}
