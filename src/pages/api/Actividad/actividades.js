// pages/api/actividades.js
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
SELECT
  A.IdActividad,
  A.IdUsuario,
  P.nombreproveedor,
  A.Accion,
  A.FechaHora,
  A.DireccionIP,
  A.AgenteUsuario
FROM [PRESIDENCIA].[dbo].[ActividadUsuarios] AS A
LEFT JOIN [PRESIDENCIA].[dbo].[proveedores] AS P
  ON A.IdUsuario = P.claveproveedor
ORDER BY A.FechaHora DESC;


    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo actividad:", error);
    return res.status(500).json({ message: "Error obteniendo actividad" });
  }
}
