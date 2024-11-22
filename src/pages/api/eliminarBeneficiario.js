// pages/api/eliminarBeneficiario.js
import { connectToDatabase } from './connectToDatabase';
import cloudinary from 'cloudinary';

// Configura Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { idBeneficiario } = req.body;

    if (!idBeneficiario) {
      return res.status(400).json({ error: 'Falta el ID del beneficiario' });
    }

    try {
      const pool = await connectToDatabase();

      // Consulta para obtener la URL de la imagen del beneficiario antes de eliminar
      const imageResult = await pool.request()
        .input('idBeneficiario', idBeneficiario)
        .query('SELECT FOTO_URL FROM PRESIDENCIA.dbo.BENEFICIARIO WHERE ID_BENEFICIARIO = @idBeneficiario');

      if (imageResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }

      const { FOTO_URL } = imageResult.recordset[0];

      // Si existe una URL de imagen, elimina la imagen de Cloudinary
      if (FOTO_URL) {
        const publicId = extractCloudinaryPublicId(FOTO_URL); // Extrae el public_id de la URL
        await cloudinary.v2.uploader.destroy(publicId);
        console.log(`Imagen eliminada de Cloudinary: ${publicId}`);
      }

      // Eliminar el beneficiario de la base de datos
      const result = await pool.request()
        .input('idBeneficiario', idBeneficiario)
        .query('DELETE FROM PRESIDENCIA.dbo.BENEFICIARIO WHERE ID_BENEFICIARIO = @idBeneficiario');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }

      res.status(200).json({ message: 'Beneficiario e imagen eliminados correctamente' });
    } catch (error) {
      console.error('Error al eliminar el beneficiario:', error);
      res.status(500).json({ error: 'Error al eliminar el beneficiario' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}

// Función para extraer el `public_id` de la URL de Cloudinary
function extractCloudinaryPublicId(imageUrl) {
  const regex = /\/([^\/]*)\.[a-zA-Z]{3,4}$/; // Extrae el nombre del archivo antes de la extensión
  const match = imageUrl.match(regex);
  return match ? match[1] : null; // Devuelve el `public_id`
}
