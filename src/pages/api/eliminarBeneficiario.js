import { connectToDatabase } from './connectToDatabase';
import cloudinary from '../../lib/cloudinaryServer'; // Importa la configuración centralizada de Cloudinary

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { idBeneficiario } = req.body;

    if (!idBeneficiario) {
      return res.status(400).json({ error: 'Falta el ID del beneficiario' });
    }

    try {
      const pool = await connectToDatabase();

      // Obtener URL de la imagen
      const imageResult = await pool.request()
        .input('idBeneficiario', idBeneficiario)
        .query('SELECT FOTO_URL FROM PRESIDENCIA.dbo.BENEFICIARIO WHERE ID_BENEFICIARIO = @idBeneficiario');

      if (imageResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }

      const { FOTO_URL } = imageResult.recordset[0];

      // Eliminar la imagen de Cloudinary si existe
      if (FOTO_URL) {
        const publicId = extractCloudinaryPublicId(FOTO_URL);
        await cloudinary.uploader.destroy(publicId, { invalidate: true }); // Usar invalidate
        console.log(`Imagen eliminada de Cloudinary: ${publicId}`);
      }

      // Eliminar beneficiario de la base de datos
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
  const regex = /\/([^\/]*)\.[a-zA-Z]{3,4}$/;
  const match = imageUrl.match(regex);
  return match ? match[1] : null;
}
