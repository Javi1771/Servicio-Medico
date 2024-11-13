import cloudinary from 'cloudinary';

// Ignorar verificación de certificado SSL (solo para desarrollo)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { image } = req.body;

    try {
      const result = await cloudinary.v2.uploader.upload(image, {
        folder: 'beneficiarios',
      });

      res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      res.status(500).json({ error: 'Error al subir imagen' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
