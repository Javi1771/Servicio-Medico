/** @type {import('next').NextConfig} */
import https from 'https';

const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  // Aquí agregamos la configuración de Webpack:
  webpack: (config, { isServer }) => {
    // Si NO estamos en el servidor, sobreescribimos el fallback para fs
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

// Configuración para certificados autofirmados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Evita rechazar certificados autofirmados globalmente

const agent = new https.Agent({
  rejectUnauthorized: false, // Ignorar validación de certificados
});
global.httpsAgent = agent; // Hacer el agente HTTPS global para tu aplicación

export default nextConfig;
