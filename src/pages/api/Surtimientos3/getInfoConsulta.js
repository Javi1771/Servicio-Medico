// pages/api/Surtimientos3/getInfoConsulta.js
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  const { claveconsulta } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!claveconsulta) {
    return res.status(400).json({ error: 'Falta claveconsulta' });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input('claveconsulta', sql.VarChar, claveconsulta)
      .query(`
        SELECT 
          c.claveconsulta,
          c.clavenomina,
          c.nombrepaciente,
          c.edad,
          c.departamento,
          c.parentesco,
          c.sindicato,
          c.elpacienteesempleado,
          c.diagnostico,
          c.especialidadinterconsulta,    -- <— aquí lo agregamos
          p.nombreproveedor,
          p.claveespecialidad,
          e.especialidad
        FROM PRUEBAS.dbo.consultas AS c
        LEFT JOIN PRUEBAS.dbo.proveedores AS p
          ON c.claveproveedor = p.claveproveedor
        LEFT JOIN PRUEBAS.dbo.especialidades AS e
          ON p.claveespecialidad = e.claveespecialidad
        WHERE c.claveconsulta = @claveconsulta
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    // Ahora `consulta.especialidadinterconsulta` estará definido
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('API getInfoConsulta error:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
}
