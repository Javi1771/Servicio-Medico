import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con opciones para ignorar SSL en desarrollo
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Asegúrate de usar HTTPS siempre que sea posible
  httpAgent: global.httpsAgent, // Usa el agente HTTPS global
});

// En desarrollo, configura el agente HTTPS para ignorar SSL
if (process.env.NODE_ENV === 'development') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    httpAgent: global.httpsAgent, // Usa el agente HTTPS global
  });
}

export default cloudinary;