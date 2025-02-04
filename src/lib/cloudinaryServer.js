import { v2 as cloudinary } from "cloudinary";
import { httpsAgent } from "../../next.config.mjs"; // Importamos la configuración de HTTPS

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Asegurar que siempre use HTTPS
});

// En desarrollo, usa el agente HTTPS
if (process.env.NODE_ENV === "development") {
  cloudinary.config({
    httpAgent: httpsAgent, // Usa el agente HTTPS para evitar problemas de certificados
  });
}

export default cloudinary;
