import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID del medicamento es requerido.' });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        DELETE FROM MEDICAMENTOS_NEW
        WHERE claveMedicamento = @id
      `;
      const result = await pool.request().input('id', sql.Int, id).query(query);

      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ message: 'Medicamento eliminado correctamente.' });
      } else {
        res.status(404).json({ message: 'Medicamento no encontrado.' });
      }
    } catch (error) {
      console.error('Error al eliminar medicamento:', error);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
