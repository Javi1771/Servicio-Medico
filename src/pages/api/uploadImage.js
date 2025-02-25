// pages/api/uploadImage.js
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // Ajusta según necesites
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { image, numNomina } = req.body;

    if (!numNomina) {
      return res
        .status(400)
        .json({ error: "El número de nómina es obligatorio." });
    }
    if (!image) {
      return res.status(400).json({ error: "No se recibió la imagen base64." });
    }

    // Decodificar la imagen base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Define dónde guardarás el archivo en tu servidor
    // p.ej. /public/uploads/beneficiarios/<numNomina>/
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "beneficiarios",
      numNomina
    );

    // Crear la carpeta si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre único para la foto
    const fileName = `foto_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    // Guardar el archivo
    fs.writeFileSync(filePath, buffer);

    // Construir la URL final para acceder al archivo
    // Asumiendo que sirves /public en http://172.16.0.7/uploads
    // Si tu Next.js corre en el puerto 3000:
   const finalURL = `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/beneficiarios/${numNomina}/${fileName}`;

    return res.status(200).json({
      imageUrl: finalURL,
      message: "Imagen subida correctamente al servidor propio.",
    });
  } catch (error) {
    console.error("Error al subir la imagen en el servidor:", error);
    return res
      .status(500)
      .json({ error: "Error al guardar la imagen en el servidor." });
  }
}
