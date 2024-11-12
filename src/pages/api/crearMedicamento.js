// /pages/api/crearMedicamento.js
import { connectToDatabase } from '../api/connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { medicamento, clasificacion } = req.body;

  // Log para verificar los datos recibidos
  console.log("Datos recibidos:", { medicamento, clasificacion });

  // Validación de datos
  if (!medicamento || !clasificacion) {
    console.log("Faltan datos requeridos (medicamento o clasificacion)");
    return res.status(400).json({ message: 'Faltan datos requeridos (medicamento o clasificacion)' });
  }

  try {
    console.log("Intentando conectar a la base de datos...");
    const pool = await connectToDatabase();
    console.log("Conexión a la base de datos exitosa.");

    // Generar un nuevo valor para CLAVEMEDICAMENTO
    const { recordset } = await pool.request().query('SELECT MAX(CONVERT(INT, CLAVEMEDICAMENTO)) AS maxClave FROM MEDICAMENTOS');
    const maxClave = recordset[0]?.maxClave || 0;
    const nuevaClaveMedicamento = (maxClave + 1).toString(); // Incrementa y convierte a string

    console.log("Nueva clave generada para el medicamento:", nuevaClaveMedicamento);

    // Insertar el medicamento con clasificación y clave generada en la tabla MEDICAMENTOS
    console.log("Ejecutando consulta para insertar medicamento...");
    const result = await pool.request()
      .input('clavemedicamento', sql.NVarChar(15), nuevaClaveMedicamento)
      .input('medicamento', sql.NVarChar('MAX'), medicamento)
      .input('clasificacion', sql.NVarChar(1), clasificacion)
      .query(`
        INSERT INTO MEDICAMENTOS (CLAVEMEDICAMENTO, MEDICAMENTO, CLASIFICACION)
        VALUES (@clavemedicamento, @medicamento, @clasificacion)
      `);

    console.log("Medicamento agregado exitosamente:", result);
    res.status(201).json({ message: 'Medicamento agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar el medicamento:', error); // Log del error específico
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
