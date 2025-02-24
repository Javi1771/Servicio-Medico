// pages/api/farmacia/surtirMedicamentos.js
import { connectToDatabase } from '../../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  const { folioSurtimiento, detalle, recetaCompletada, cost } = req.body;
  if (!folioSurtimiento || !detalle) {
    return res.status(400).json({ message: 'folioSurtimiento y detalle son requeridos' });
  }

  // Validar que delta sea >= 0 para cada detalle
  for (const item of detalle) {
    if (item.delta < 0) {
      return res.status(400).json({
        message: `Error en el detalle del medicamento con clave ${item.claveMedicamento}: delta negativo.`
      });
    }
  }

  try {
    const db = await connectToDatabase();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // Actualizar stock y detalleSurtimientos para cada detalle
      for (const item of detalle) {
        const delta = item.delta; // Piezas nuevas a descontar
        if (delta > 0) {
          const updateMed = `
            UPDATE [PRESIDENCIA].[dbo].[medicamentos]
            SET piezas = piezas - @delta
            WHERE claveMedicamento = @claveMedicamento
          `;
          await transaction.request()
            .input('delta', sql.Int, delta)
            .input('claveMedicamento', sql.NVarChar(50), item.claveMedicamento)
            .query(updateMed);
        }

        const updateDetalle = `
          UPDATE [PRESIDENCIA].[dbo].[detalleSurtimientos]
          SET estatus = @estatus,
              entregado = @delivered
          WHERE idSurtimiento = @idSurtimiento
        `;
        await transaction.request()
          .input('estatus', sql.Int, item.estatus)
          .input('delivered', sql.Int, item.delivered)
          .input('idSurtimiento', sql.Int, item.idSurtimiento)
          .query(updateDetalle);
      }

      // Si la receta se completó, actualizar SURTIMIENTOS usando GETDATE() sin formateo
      if (recetaCompletada) {
        const updateSurtimiento = `
          UPDATE [PRESIDENCIA].[dbo].[SURTIMIENTOS]
          SET ESTATUS = 0,
              FECHA_DESPACHO = GETDATE(),
              COSTO = @cost
          WHERE FOLIO_SURTIMIENTO = @folio
        `;
        await transaction.request()
          .input('folio', sql.Int, folioSurtimiento)
          .input('cost', sql.Numeric(18, 2), cost || 0)
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
