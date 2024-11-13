// pages/api/eliminarBeneficiario.js
import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { idBeneficiario } = req.body;

    if (!idBeneficiario) {
      return res.status(400).json({ error: 'Falta el ID del beneficiario' });
    }

    try {
      const pool = await connectToDatabase();
      const result = await pool.request()
        .input('idBeneficiario', idBeneficiario)
        .query('DELETE FROM PRESIDENCIA.dbo.BENEFICIARIO WHERE ID_BENEFICIARIO = @idBeneficiario');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }

      res.status(200).json({ message: 'Beneficiario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el beneficiario:', error);
      res.status(500).json({ error: 'Error al eliminar el beneficiario' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
