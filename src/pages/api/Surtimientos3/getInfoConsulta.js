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
      .input('claveconsulta', sql.VarChar, claveconsulta) // Nota: aquí hay una 'a' suelta en tu código original, la he quitado.
      .query(`
        SELECT
          c.claveconsulta,
          -- Asumiendo que clavenomina podría ser NTEXT
          RTRIM(CAST(c.clavenomina AS NVARCHAR(MAX))) as clavenomina,
          RTRIM(CAST(c.clavepaciente AS NVARCHAR(MAX))) as clavepaciente, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.nombrepaciente AS NVARCHAR(MAX))) as nombrepaciente, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.edad AS NVARCHAR(MAX))) as edad, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.departamento AS NVARCHAR(MAX))) as departamento, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.parentesco AS NVARCHAR(MAX))) as parentesco, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.sindicato AS NVARCHAR(MAX))) as sindicato, -- Aplicar CAST si también es NTEXT
          RTRIM(CAST(c.elpacienteesempleado AS NVARCHAR(MAX))) as elpacienteesempleado, -- Aplicar CAST si también es NTEXT
          -- Especialmente importante para diagnostico si es NTEXT, ya que suele ser largo
          RTRIM(CAST(c.diagnostico AS NVARCHAR(MAX))) as diagnostico,
          c.especialidadinterconsulta,
          RTRIM(CAST(p.nombreproveedor AS NVARCHAR(MAX))) as nombreproveedor, -- Aplicar CAST si también es NTEXT
          p.claveespecialidad,
          RTRIM(CAST(e.especialidad AS NVARCHAR(MAX))) as especialidad, -- Aplicar CAST si también es NTEXT
          c.claveproveedor
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
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('API getInfoConsulta error:', error);
    let errorMessage = 'Error en la base de datos';
    if (error.originalError && error.originalError.info && error.originalError.info.message) {
        errorMessage = `Error de base de datos: ${error.originalError.info.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({ error: errorMessage });
  }
}    