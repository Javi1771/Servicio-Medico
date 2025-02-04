/** @type {import('next').NextConfig} */
import { Agent } from "https";

const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
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
