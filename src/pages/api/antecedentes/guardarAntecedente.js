import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { descripcion, clavenomina, nombrePaciente, tipoAntecedente, fechaInicioEnfermedad } = req.body;

  if (!descripcion || !clavenomina || !nombrePaciente || !tipoAntecedente || !fechaInicioEnfermedad) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    await pool.request()
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
      .input('clavenomina', sql.NVarChar(sql.MAX), clavenomina)
      .input('nombre_paciente', sql.NVarChar(sql.MAX), nombrePaciente)
      .input('tipo_antecedente', sql.NVarChar(sql.MAX), tipoAntecedente)
      .input('fecha_inicio_enfermedad', sql.DateTime, fechaInicioEnfermedad)
      .query(`
        INSERT INTO antecedentes_clinicos (descripcion, clavenomina, nombre_paciente, tipo_antecedente, fecha_inicio_enfermedad)
        VALUES (@descripcion, @clavenomina, @nombre_paciente, @tipo_antecedente, @fecha_inicio_enfermedad)
      `);

    res.status(200).json({ message: 'Antecedente guardado correctamente.' });
  } catch (error) {
    console.error('Error al guardar el antecedente:', error);
    res.status(500).json({ message: 'Error al guardar el antecedente.', error });
  }
}
