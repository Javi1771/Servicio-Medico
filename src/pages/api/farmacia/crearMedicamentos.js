import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { medicamento, clasificación, presentación, ean, piezas } = req.body;

    if (!medicamento || clasificación == null || presentación == null || ean == null || piezas == null) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
      const dbPool = await connectToDatabase();

      //* Verificar si ya existe el medicamento (por EAN o nombre)
      const checkQuery = `
        SELECT COUNT(*) AS count 
        FROM MEDICAMENTOS 
        WHERE ean = @ean OR medicamento = @medicamento
      `;
      const checkResult = await dbPool.request()
        .input('ean', sql.BigInt, ean)
        .input('medicamento', sql.VarChar, medicamento)
        .query(checkQuery);

      if (checkResult.recordset[0].count > 0) {
        return res.status(400).json({ message: 'El medicamento ya está registrado.' });
      }

      //* Consultar el último valor de claveMedicamento y sumarle 1
      const claveQuery = `
        SELECT ISNULL(MAX(claveMedicamento), 0) + 1 AS newClave
        FROM MEDICAMENTOS
      `;
      const claveResult = await dbPool.request().query(claveQuery);
      const newClaveMedicamento = claveResult.recordset[0].newClave;

      //* Insertar el medicamento con la nueva clave
      const insertQuery = `
        INSERT INTO MEDICAMENTOS (claveMedicamento, medicamento, clasificacion, presentacion, ean, piezas)
        VALUES (@claveMedicamento, @medicamento, @clasificación, @presentación, @ean, @piezas)
      `;

      await dbPool.request()
        .input('claveMedicamento', sql.Int, newClaveMedicamento)
        .input('medicamento', sql.VarChar, medicamento)
        .input('clasificación', sql.NVarChar(1), clasificación)
        .input('presentación', sql.Int, presentación)
        .input('ean', sql.BigInt, ean)
        .input('piezas', sql.Int, piezas)
        .query(insertQuery);

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
