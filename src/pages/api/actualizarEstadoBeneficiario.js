import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const pool = await connectToDatabase();

      // Actualiza los beneficiarios cuya vigencia ha expirado
      const result = await pool.request()
        .query(`
          UPDATE BENEFICIARIO
          SET ACTIVO = 'I' -- Cambia el estado a inactivo
          WHERE VIGENCIA < GETDATE() -- Vigencia ya ha expirado
            AND ACTIVO = 'A'; -- Solo afecta beneficiarios activos
        `);

      res.status(200).json({ 
        message: 'Estados de beneficiarios actualizados correctamente.',
        rowsAffected: result.rowsAffected[0],
      });
    } catch (error) {
      console.error('Error al actualizar el estado de los beneficiarios:', error);
      res.status(500).json({ message: 'Error al actualizar los estados.' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido.' });
  }
}
