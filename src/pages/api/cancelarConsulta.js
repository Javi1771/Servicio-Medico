/* eslint-disable @typescript-eslint/no-unused-vars */
import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { claveConsulta, clavestatus } = req.body;

  if (!claveConsulta || !clavestatus) {
    return res.status(400).json({ message: 'Datos incompletos.' });
  }

  try {
    const pool = await connectToDatabase();

    //* Actualiza `clavestatus` a 3 y limpia otros campos de la consulta
    await pool.request()
      .input('claveconsulta', sql.Int, claveConsulta)
      .input('clavestatus', sql.Int, clavestatus)
      .query(`
        UPDATE consultas
        SET clavestatus = @clavestatus,
            diagnostico = NULL,
            motivoConsulta = NULL,
            observaciones = NULL,
            ta = NULL,
            temperatura = NULL,
            fc = NULL,
            oxigenacion = NULL,
            altura = NULL,
            peso = NULL,
            glucosa = NULL,
            especialidadSeleccionada = NULL,
            alergias = NULL,
            incapacidades = NULL
        WHERE claveconsulta = @claveconsulta
      `);

    res.status(200).json({ message: 'Consulta cancelada y datos borrados correctamente.' });
  } catch (error) {
    console.error('Error al cancelar consulta y borrar datos:', error);
    res.status(500).json({ message: 'Error al cancelar consulta.' });
  }
}
