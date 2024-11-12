// /pages/api/editarMedicamento.js
import sql from 'mssql';
import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { clavemedicamento, medicamento, clasificacion } = req.body;

  // Log de los datos recibidos
  console.log("Datos recibidos:", { clavemedicamento, medicamento, clasificacion });

  // Validación de datos
  if (!clavemedicamento || !medicamento || !clasificacion) {
    return res.status(400).json({ message: 'Faltan datos requeridos (clave del medicamento, nombre del medicamento o clasificación)' });
  }

  try {
    const pool = await connectToDatabase();

    // Preparar la consulta de actualización
    const request = pool.request()
      .input('clavemedicamento', sql.NVarChar, clavemedicamento)
      .input('medicamento', sql.NVarChar, medicamento)
      .input('clasificacion', sql.NVarChar, clasificacion);

    const query = `
      UPDATE MEDICAMENTOS
      SET 
        MEDICAMENTO = @medicamento,
        CLASIFICACION = @clasificacion
      WHERE CLAVEMEDICAMENTO = @clavemedicamento
    `;

    // Ejecutar la consulta
    await request.query(query);

    res.status(200).json({ message: 'Medicamento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el medicamento:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}
