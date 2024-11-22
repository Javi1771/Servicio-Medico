// /pages/api/eliminarMedicamento.js
import sql from 'mssql';
import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { clavemedicamento } = req.query;

  if (!clavemedicamento) {
    return res.status(400).json({ message: 'Clave del medicamento no proporcionada' });
  }

  try {
    const pool = await connectToDatabase();
    await pool.request()
      .input('clavemedicamento', sql.VarChar, clavemedicamento)
      .query('DELETE FROM MEDICAMENTOS WHERE CLAVEMEDICAMENTO = @clavemedicamento');

    res.status(200).json({ message: 'Medicamento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el medicamento:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
