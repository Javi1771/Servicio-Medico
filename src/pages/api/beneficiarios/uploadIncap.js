import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Deshabilitamos bodyParser para usar formidable
  },
};

// Diccionario para traducir el ID de parentesco al texto
const PARENTESCO_MAP = {
  "1": "Esposo(a)",
  "2": "Hijo(a)",
  "3": "Concubino(a)",
  "4": "Padre",
  "5": "Madre",
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

    // Extraer el archivo y los campos necesarios
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let { numNomina, nombre, aPaterno, aMaterno, parentesco } = fields;
    if (Array.isArray(numNomina)) numNomina = numNomina[0];
    if (Array.isArray(nombre)) nombre = nombre[0];
    if (Array.isArray(aPaterno)) aPaterno = aPaterno[0];
    if (Array.isArray(aMaterno)) aMaterno = aMaterno[0];
    if (Array.isArray(parentesco)) parentesco = parentesco[0];

    if (!file) {
      console.error("Archivo no encontrado en la solicitud");
      return res.status(400).json({ error: "Archivo no encontrado en la solicitud." });
    }
    if (!numNomina) {
      console.error("Número de nómina no proporcionado");
      return res.status(400).json({ error: "El número de nómina es obligatorio." });
    }
    if (!nombre || !aPaterno || !aMaterno || !parentesco) {
      console.error("Faltan campos obligatorios: nombre completo o parentesco");
      return res.status(400).json({
        error:
          "El nombre, apellido paterno, apellido materno y el parentesco son obligatorios.",
      });
    }

    // Traducir el ID de parentesco al texto
    const parentescoTexto = PARENTESCO_MAP[parentesco] || "Desconocido";

    // Construir el nombre de la carpeta a partir del nombre completo (se eliminan espacios extra)
    const folderName = `${nombre.trim()}_${aPaterno.trim()}_${aMaterno.trim()}`.replace(/\s+/g, "_");

    try {
      // Construir la carpeta destino:
      // /public/Beneficiarios/Documentos/ActasIncapacidad/{numNomina}/{parentescoTexto}/{folderName}/
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "Beneficiarios",
        "Documentos",
        "ActasIncapacidad",
        numNomina,
        parentescoTexto,
        folderName
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generar un nombre único para el archivo
      const fileName = `incapacidad_${Date.now()}${path.extname(file.originalFilename || "")}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover el archivo desde la ubicación temporal a la carpeta destino
      fs.renameSync(file.filepath, filePath);

      // Construir la URL final para acceder al archivo.
      const finalURL = `${process.env.NEXT_PUBLIC_BASE_URL}/Beneficiarios/Documentos/ActasIncapacidad/${numNomina}/${parentescoTexto}/${folderName}/${fileName}`;

      return res.status(200).json({
        url: finalURL,
        message: "Acta de Incapacidad subida correctamente al servidor propio.",
      });
    } catch (error) {
      console.error("Error al subir el archivo de Incapacidad:", error);
      return res.status(500).json({ error: "Error al subir el archivo. Intenta nuevamente." });
    }
  });
}
