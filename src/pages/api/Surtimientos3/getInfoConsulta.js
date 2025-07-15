// src/pages/api/Surtimientos3/getInfoConsulta.js
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
          RTRIM(CAST(c.clavenomina      AS NVARCHAR(MAX))) AS clavenomina,
          RTRIM(CAST(c.clavepaciente    AS NVARCHAR(MAX))) AS clavepaciente,
          RTRIM(CAST(c.nombrepaciente   AS NVARCHAR(MAX))) AS nombrepaciente,
          RTRIM(CAST(c.edad            AS NVARCHAR(MAX))) AS edad,
          RTRIM(CAST(c.departamento     AS NVARCHAR(MAX))) AS departamento,

          -- 🔸 Descripción del parentesco; si no existe → 'EMPLEADO'
          ISNULL(
            RTRIM(CAST(par.PARENTESCO   AS NVARCHAR(MAX))),
            'EMPLEADO'
          )                                        AS parentesco,

          RTRIM(CAST(c.sindicato        AS NVARCHAR(MAX))) AS sindicato,
          RTRIM(CAST(c.elpacienteesempleado AS NVARCHAR(MAX))) AS elpacienteesempleado,
          RTRIM(CAST(c.diagnostico      AS NVARCHAR(MAX))) AS diagnostico,
          c.especialidadinterconsulta,

          RTRIM(CAST(p.nombreproveedor  AS NVARCHAR(MAX))) AS nombreproveedor,
          p.claveespecialidad,
          RTRIM(CAST(e.especialidad     AS NVARCHAR(MAX))) AS especialidad,
          c.claveproveedor
        FROM dbo.consultas      AS c
        LEFT JOIN dbo.proveedores    AS p  ON c.claveproveedor  = p.claveproveedor
        LEFT JOIN dbo.especialidades AS e  ON p.claveespecialidad = e.claveespecialidad
        LEFT JOIN dbo.PARENTESCO     AS par
               ON TRY_CAST(c.parentesco AS INT) = par.ID_PARENTESCO
        WHERE c.claveconsulta = @claveconsulta
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('API getInfoConsulta error:', error);
    let errorMessage = 'Error en la base de datos';
    if (error.originalError?.info?.message) {
      errorMessage = `Error de base de datos: ${error.originalError.info.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ error: errorMessage });
  }
}
