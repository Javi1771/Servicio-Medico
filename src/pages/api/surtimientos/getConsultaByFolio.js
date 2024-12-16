
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { folio } = req.query;

  if (!folio) {
    return res.status(400).json({ message: 'El folio es requerido.' });
  }

  try {
    const pool = await connectToDatabase();

    // Consulta principal
    const consultaQuery = `
      SELECT *
      FROM consultas
      WHERE claveconsulta = @folio
    `;
    const consultaResult = await pool.request()
      .input('folio', sql.Int, folio)
      .query(consultaQuery);

    if (!consultaResult.recordset || consultaResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No se encontró información para el folio proporcionado.' });
    }

    const consulta = consultaResult.recordset[0];

    // Consulta del médico (tabla usuarios)
    let medico = null;
    if (consulta.claveproveedor) {
      const medicoQuery = `
        SELECT nombreusuario
        FROM usuarios
        WHERE claveusuario = @claveusuario
      `;
      const medicoResult = await pool.request()
        .input('claveusuario', sql.Int, consulta.claveproveedor)
        .query(medicoQuery);
      medico = medicoResult.recordset[0]?.nombreusuario || 'Desconocido';
    }

    // Consulta de la especialidad (tabla especialidades)
    let especialidad = null;
    if (consulta.especialidadinterconsulta) {
      const especialidadQuery = `
        SELECT especialidad
        FROM especialidades
        WHERE claveespecialidad = @claveespecialidad
      `;
      const especialidadResult = await pool.request()
        .input('claveespecialidad', sql.Int, consulta.especialidadinterconsulta)
        .query(especialidadQuery);
      especialidad = especialidadResult.recordset[0]?.especialidad || 'Desconocida';
    }

    res.status(200).json({ ...consulta, medico, especialidad });
  } catch (error) {
    console.error('Error al obtener los datos:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}