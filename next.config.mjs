/** @type {import('next').NextConfig} */
import { Agent } from "https";

const nextConfig = {
  images: {
    // Agrega tu dominio interno "172.16.0.7" además de "res.cloudinary.com"
    domains: ["172.16.4.47"],
    //domains: ["172.16.31.211"],

  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

// Configurar HTTPS correctamente sin desactivar validaciones SSL globales
const httpsAgent = new Agent({ rejectUnauthorized: false });

export { httpsAgent };
export default nextConfig;
