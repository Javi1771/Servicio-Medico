import cloudinary from "../../../lib/cloudinaryServer";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // usamos formidable, así que deshabilitamos el bodyParser
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
    const { numNomina } = fields;

    if (!file) {
      return res
        .status(400)
        .json({ error: "No se recibió ningún archivo en la solicitud." });
    }

    if (!numNomina) {
      return res
        .status(400)
        .json({ error: "El número de nómina es obligatorio." });
    }

    try {
      // Carpeta en Cloudinary
      const folderPath = `acta_concubinato_manual/${numNomina}`;

      const uploadResponse = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw", // Para PDF
        folder: folderPath,
        use_filename: true,
        unique_filename: false,
      });

      return res.status(200).json({
        url: uploadResponse.secure_url, // URL pública
      });
    } catch (error) {
      console.error("Error al subir el archivo de Concubinato Manual:", error);
      return res
        .status(500)
        .json({ error: "Error al subir el archivo de Concubinato Manual." });
    }
  });
}
