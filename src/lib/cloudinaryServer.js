import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

// Configurar Cloudinary con opciones para ignorar SSL en desarrollo
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Asegúrate de usar HTTPS siempre que sea posible
});

// En desarrollo, configura el agente HTTPS para ignorar SSL
if (process.env.NODE_ENV === 'development') {
  cloudinary.options = {
    http_agent: new https.Agent({
      rejectUnauthorized: false, // Ignora verificación SSL en desarrollo
    }),
  };
}

export default cloudinary;
