import { connectToDatabase } from '../../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  const { folioSurtimiento, detalle, recetaCompletada } = req.body;
  if (!folioSurtimiento || !detalle) {
    return res
      .status(400)
      .json({ message: 'folioSurtimiento y detalle son requeridos' });
  }

  try {
    const db = await connectToDatabase();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // Para cada detalle, se actualiza la tabla MEDICAMENTOS y el detalle de surtimiento
      for (const item of detalle) {
        // item.delivered: piezas entregadas = (cantidad - piezasPendientes)
        const delivered = item.delivered; // calculado en el componente

        if (delivered > 0) {
          const updateMed = `
            UPDATE [PRESIDENCIA].[dbo].[medicamentos]
            SET piezas = piezas - @delivered
            WHERE claveMedicamento = @claveMedicamento
          `;
          await transaction.request()
            .input('delivered', sql.Int, delivered)
            .input('claveMedicamento', sql.NVarChar(50), item.claveMedicamento)
            .query(updateMed);
        }
        // Actualizar el detalle de surtimiento: asignar estatus y actualizar el campo "entregado"
        const updateDetalle = `
          UPDATE [PRESIDENCIA].[dbo].[detalleSurtimientos]
          SET estatus = @estatus,
              entregado = @delivered
          WHERE idSurtimiento = @idSurtimiento
        `;
        await transaction.request()
          .input('estatus', sql.Int, item.estatus)
          .input('delivered', sql.Int, delivered)
          .input('idSurtimiento', sql.Int, item.idSurtimiento)
          .query(updateDetalle);
      }

      // Si la receta se completó, actualizar la tabla SURTIMIENTOS a ESTATUS=0 (receta surtida)
      if (recetaCompletada) {
        const updateSurtimiento = `
          UPDATE [PRESIDENCIA].[dbo].[SURTIMIENTOS]
          SET ESTATUS = 0
          WHERE FOLIO_SURTIMIENTO = @folio
        `;
        await transaction.request()
          .input('folio', sql.Int, folioSurtimiento)
          .query(updateSurtimiento);
      }

      await transaction.commit();
      return res.status(200).json({ message: 'Cambios guardados con éxito' });
    } catch (err) {
      await transaction.rollback();
      console.error('Error en transacción surtirMedicamentos:', err);
      return res.status(500).json({ message: 'Error en la transacción', error: err.message });
    }
  } catch (error) {
    console.error('Error conectando a DB en surtirMedicamentos:', error);
    return res.status(500).json({ message: error.message });
  }
}
