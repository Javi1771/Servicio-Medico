import { connectToDatabase } from './connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const pool = await connectToDatabase();

      // Actualiza los beneficiarios cuya vigencia ha expirado a inactivo
      const desactivarResult = await pool.request()
        .query(`
          UPDATE BENEFICIARIO
          SET ACTIVO = 'I' -- Cambia el estado a inactivo
          WHERE VIGENCIA < GETDATE() -- Vigencia ya ha expirado
            AND ACTIVO = 'A'; -- Solo afecta beneficiarios activos
        `);

      // Reactiva beneficiarios con vigencia actual o futura
      const activarResult = await pool.request()
        .query(`
          UPDATE BENEFICIARIO
          SET ACTIVO = 'A' -- Cambia el estado a activo
          WHERE VIGENCIA >= GETDATE() -- Vigencia actual o futura
            AND ACTIVO = 'I'; -- Solo afecta beneficiarios inactivos
        `);

      res.status(200).json({
        message: 'Estados de beneficiarios actualizados correctamente.',
        desactivados: desactivarResult.rowsAffected[0], // Beneficiarios pasados a inactivo
        activados: activarResult.rowsAffected[0], // Beneficiarios reactivados
      });
    } catch (error) {
      console.error('Error al actualizar el estado de los beneficiarios:', error);
      res.status(500).json({ message: 'Error al actualizar los estados.' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido.' });
  }
}
