import cloudinary from "../../../lib/cloudinaryServer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
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

    if (!file) {
      console.error("Archivo no encontrado en la solicitud");
      return res.status(400).json({
        error: "Archivo no encontrado en la solicitud.",
      });
    }

    try {
      const uploadResponse = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw",
        folder: "cartas_no_afiliacion",
        use_filename: true,
        unique_filename: false,
      });

      return res.status(200).json({
        url: uploadResponse.secure_url,
      });
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      return res
        .status(500)
        .json({ error: "Error al subir el archivo. Intenta nuevamente." });
    }
  });
}
