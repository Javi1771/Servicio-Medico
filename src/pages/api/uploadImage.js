import cloudinary from '../../lib/cloudinaryServer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '3mb', // Ajusta el tamaño según tus necesidades
    },
  },
};

// Desactivar la verificación SSL solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { image } = req.body;

    try {
      const result = await cloudinary.uploader.upload(image, {
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