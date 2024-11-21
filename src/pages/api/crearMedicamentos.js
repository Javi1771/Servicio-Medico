import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { ean, sustancia, piezas, activo } = req.body;

    // Validar que los datos requeridos estén presentes
    if (!ean || !sustancia || !piezas) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios (excepto activo).' });
    }

    try {
      const dbPool = await connectToDatabase();
      
      const query = `
        INSERT INTO MEDICAMENTOS_FARMACIA (ean, sustancia, piezas, fecha_creacion, activo)
        VALUES (@ean, @sustancia, @piezas, GETDATE(), @activo)
      `;

      // Hacer el registro
      await dbPool.request()
        .input('ean', sql.BigInt, ean)
        .input('sustancia', sql.NVarChar(50), sustancia)
        .input('piezas', sql.BigInt, piezas)
        .input('activo', sql.Bit, activo !== undefined ? activo : 1) // Por defecto, activo = 1
        .query(query);

      res.status(200).json({ message: 'Medicamento registrado exitosamente' });
    } catch (error) {
      console.error('Error al registrar medicamento:', error);
      res.status(500).json({ message: 'Error interno del servidor', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
