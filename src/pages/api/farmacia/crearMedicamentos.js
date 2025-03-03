import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  }

  const { medicamento, clasificacion, presentacion, ean, piezas, maximo, minimo, medida } = req.body;

  console.log("📌 Datos recibidos en la solicitud:", req.body);

  // Validar que todos los campos estén presentes
  if (
    !medicamento || 
    clasificacion == null || 
    presentacion == null || 
    ean == null || 
    piezas == null ||
    maximo == null ||
    minimo == null ||
    medida == null
  ) {
    console.error("⚠️ Faltan datos obligatorios:", { medicamento, clasificacion, presentacion, ean, piezas, maximo, minimo, medida });
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    console.log("🔗 Conectando a la base de datos...");
    const dbPool = await connectToDatabase();
    console.log("✅ Conexión exitosa a la base de datos");

    // Verificar si ya existe el medicamento por EAN o nombre
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

    // Consultar el último valor de claveMedicamento convirtiéndolo a int
    console.log("🔢 Obteniendo la última claveMedicamento...");
    const claveQuery = `
      SELECT TOP 1 CONVERT(int, claveMedicamento) AS claveInt
      FROM MEDICAMENTOS
      ORDER BY CONVERT(int, claveMedicamento) DESC
    `;
    const claveResult = await dbPool.request().query(claveQuery);
    const newClaveMedicamentoInt = (claveResult.recordset[0]?.claveInt || 0) + 1;
    // Convertir a string para almacenarlo en la BD
    const newClaveMedicamento = newClaveMedicamentoInt.toString();

    console.log("🆕 Nueva claveMedicamento asignada:", newClaveMedicamento);

    // Insertar el medicamento (claveMedicamento se inserta como string)
    console.log("📝 Insertando medicamento en la base de datos...");
    console.log("📦 Datos a insertar:", {
      claveMedicamento: newClaveMedicamento,
      medicamento,
      clasificacion,
      presentacion,
      ean,
      piezas,
      maximo,
      minimo,
      medida
    });

    const insertQuery = `
      INSERT INTO MEDICAMENTOS (claveMedicamento, medicamento, clasificacion, presentacion, ean, piezas, maximo, minimo, medida)
      VALUES (@claveMedicamento, @medicamento, @clasificacion, @presentacion, @ean, @piezas, @maximo, @minimo, @medida)
    `;

    await dbPool.request()
      .input('claveMedicamento', sql.VarChar, newClaveMedicamento)
      .input('medicamento', sql.VarChar, medicamento)
      .input('clasificacion', sql.NVarChar(1), clasificacion)
      .input('presentacion', sql.Int, presentacion)
      .input('ean', sql.BigInt, ean)
      .input('piezas', sql.Int, piezas)
      .input('maximo', sql.Int, maximo)
      .input('minimo', sql.Int, minimo)
      .input('medida', sql.Int, medida)
      .input('estatus', sql.Bit, 1)
      .query(insertQuery);

    console.log("✅ Medicamento registrado exitosamente:", medicamento);
    res.status(200).json({ message: 'Medicamento registrado exitosamente' });

  } catch (error) {
    console.error("❌ Error al registrar medicamento:", error);
    res.status(500).json({ message: 'Error interno del servidor', error });
  }
}
