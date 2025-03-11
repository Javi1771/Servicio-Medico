// pages/api/farmacia/validarEAN.js
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  const { ean, claveMedicamento } = req.body;
  if (!ean || !claveMedicamento) {
    return res.status(400).json({ message: 'EAN y claveMedicamento requeridos' });
  }

  try {
    const db = await connectToDatabase();
    // Verifica en la tabla medicamentos
    const query = `
      SELECT TOP 1 medicamento
      FROM medicamentos
      WHERE ean = @EAN
        AND claveMedicamento = @CLAVE
    `;
    const result = await db.request()
      .input('EAN', sql.VarChar(50), ean)
      .input('CLAVE', sql.VarChar(12), claveMedicamento)
      .query(query);

    if (result.recordset.length > 0) {
      return res.status(200).json({ valido: true });
    } else {
      return res.status(200).json({ valido: false });
    }
  } catch (error) {
    console.error('Error validando EAN:', error);
    return res.status(500).json({ message: error.message });
  }
}
