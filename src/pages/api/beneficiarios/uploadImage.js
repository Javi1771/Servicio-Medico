import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // Ajusta según necesites
    },
  },
};

// Diccionario para traducir el ID de parentesco a texto
const PARENTESCO_MAP = {
  "1": "Esposo(a)",
  "2": "Hijo(a)",
  "3": "Concubino(a)",
  "4": "Padre",
  "5": "Madre",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { image, numNomina, nombre, aPaterno, aMaterno, parentesco } = req.body;

    // Validaciones de campos obligatorios
    if (!numNomina) {
      return res
        .status(400)
        .json({ error: "El número de nómina es obligatorio." });
    }
    if (!image) {
      return res
        .status(400)
        .json({ error: "No se recibió la imagen en formato base64." });
    }
    if (!nombre || !aPaterno || !aMaterno || !parentesco) {
      return res.status(400).json({
        error:
          "Los campos nombre, apellido paterno, apellido materno y parentesco son obligatorios.",
      });
    }

    // Decodificar la imagen base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Obtener el texto del parentesco usando el diccionario
    const parentescoTexto = PARENTESCO_MAP[parentesco] || "Desconocido";

    // Construir el nombre de la carpeta con el nombre completo
    const folderName = `${nombre.trim()}_${aPaterno.trim()}_${aMaterno.trim()}`.replace(
      /\s+/g,
      "_"
    );

    // Construir la ruta de destino:
    // /public/Beneficiarios/Fotos/{numNomina}/{parentescoTexto}/{folderName}/
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "Beneficiarios",
      "Fotos",
      numNomina,
      parentescoTexto,
      folderName
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar un nombre único para el archivo
    const fileName = `foto_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    // Guardar el archivo en el servidor
    fs.writeFileSync(filePath, buffer);

    // Construir la URL final para acceder al archivo
    const finalURL = `${process.env.NEXT_PUBLIC_BASE_URL}/Beneficiarios/Fotos/${numNomina}/${parentescoTexto}/${folderName}/${fileName}`;

    return res.status(200).json({
      imageUrl: finalURL,
      message: "Imagen subida correctamente al servidor propio.",
    });
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    return res
      .status(500)
      .json({ error: "Error al guardar la imagen en el servidor." });
  }
}
