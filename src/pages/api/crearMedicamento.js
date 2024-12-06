import { connectToDatabase } from './connectToDatabase'; // Ajusta la ruta según corresponda
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  }

  const { medicamento, clasificacion, ean } = req.body;

  if (!medicamento || !clasificacion) {
    return res.status(400).json({ message: 'Los campos "medicamento" y "clasificacion" son requeridos.' });
  }

  try {
    const pool = await connectToDatabase(); // Conexión a la base de datos

    // Obtener el último valor de CLAVEMEDICAMENTO y calcular el siguiente
    const result = await pool.request().query(`
      SELECT MAX(CAST(CLAVEMEDICAMENTO AS INT)) AS UltimaClave
      FROM MEDICAMENTOS
    `);
    const ultimaClave = result.recordset[0].UltimaClave || 0;
    const nuevaClave = (ultimaClave + 1).toString(); // Incrementar en 1

    // Realizar la inserción
    await pool.request()
      .input('clavemedicamento', sql.NVarChar(15), nuevaClave) // Nueva clave calculada
      .input('medicamento', sql.NVarChar(sql.MAX), medicamento)
      .input('clasificacion', sql.NVarChar(1), clasificacion)
      .input('ean', sql.NVarChar(sql.MAX), ean || null)
      .query(`
        INSERT INTO MEDICAMENTOS (CLAVEMEDICAMENTO, MEDICAMENTO, CLASIFICACION, EAN, ESTATUS)
        VALUES (@clavemedicamento, @medicamento, @clasificacion, @ean, 1)
      `);

    res.status(201).json({ message: 'Medicamento agregado exitosamente', clavemedicamento: nuevaClave });
  } catch (error) {
    console.error('Error al agregar el medicamento:', error);
    res.status(500).json({ message: 'Error al agregar el medicamento', error: error.message });
  }
}
