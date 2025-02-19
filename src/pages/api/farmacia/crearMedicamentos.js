import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  }

  const { medicamento, clasificacion, presentacion, ean, piezas } = req.body;

  console.log("📌 Datos recibidos en la solicitud:", req.body);

  if (!medicamento || clasificacion == null || presentacion == null || ean == null || piezas == null) {
    console.error("⚠️ Faltan datos obligatorios:", { medicamento, clasificacion, presentacion, ean, piezas });
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    console.log("🔗 Conectando a la base de datos...");
    const dbPool = await connectToDatabase();
    console.log("✅ Conexión exitosa a la base de datos");

    //* Verificar si ya existe el medicamento por EAN o nombre
    console.log("🔍 Verificando si el medicamento ya existe...");
    const checkQuery = `
      SELECT COUNT(*) AS count 
      FROM MEDICAMENTOS 
      WHERE ean = @ean OR medicamento = @medicamento
    `;
    const checkResult = await dbPool.request()
      .input('ean', sql.BigInt, ean)
      .input('medicamento', sql.VarChar, medicamento)
      .query(checkQuery);

    console.log("📊 Resultado de verificación:", checkResult.recordset);

    if (checkResult.recordset[0].count > 0) {
      console.warn("⚠️ El medicamento ya está registrado:", medicamento, ean);
      return res.status(400).json({ message: 'El medicamento ya está registrado.' });
    }

    //* Consultar el último valor de claveMedicamento
    console.log("🔢 Obteniendo la última claveMedicamento...");
    const claveQuery = `
      SELECT TOP 1 claveMedicamento
      FROM MEDICAMENTOS
      ORDER BY claveMedicamento DESC
    `;
    const claveResult = await dbPool.request().query(claveQuery);
    const newClaveMedicamento = (claveResult.recordset[0]?.claveMedicamento || 0) + 1;

    console.log("🆕 Nueva claveMedicamento asignada:", newClaveMedicamento);

    //* Insertar el medicamento
    console.log("📝 Insertando medicamento en la base de datos...");
    console.log("📦 Datos a insertar:", {
      claveMedicamento: newClaveMedicamento,
      medicamento,
      clasificacion,
      presentacion,
      ean,
      piezas
    });

    const insertQuery = `
      INSERT INTO MEDICAMENTOS (claveMedicamento, medicamento, clasificacion, presentacion, ean, piezas)
      VALUES (@claveMedicamento, @medicamento, @clasificacion, @presentacion, @ean, @piezas)
    `;

    await dbPool.request()
      .input('claveMedicamento', sql.Int, newClaveMedicamento)
      .input('medicamento', sql.VarChar, medicamento)
      .input('clasificacion', sql.NVarChar(1), clasificacion)
      .input('presentacion', sql.Int, presentacion)
      .input('ean', sql.BigInt, ean)
      .input('piezas', sql.Int, piezas)
      .query(insertQuery);

    console.log("✅ Medicamento registrado exitosamente:", medicamento);
    res.status(200).json({ message: 'Medicamento registrado exitosamente' });

  } catch (error) {
    console.error("❌ Error al registrar medicamento:", error);
    res.status(500).json({ message: 'Error interno del servidor', error });
  }
}
