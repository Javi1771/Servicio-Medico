import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { claveconsulta } = req.query;

    if (!claveconsulta) {
      return res.status(400).json({ message: "Clave de consulta requerida" });
    }

    try {
      //* Conexión a la base de datos
      const pool = await connectToDatabase();

      // Crear una nueva solicitud
      const request = pool.request();
      request.input("claveConsulta", sql.VarChar, claveconsulta);

      //* Consulta principal con la lógica de parentesco
      const consultaQuery = `
        SELECT
          c.*, 
          CASE 
            WHEN c.parentesco = 0 THEN 'Empleado(a)'
            ELSE p.PARENTESCO
          END AS parentesco_desc,
          pr.nombreproveedor,
          e.especialidad
        FROM consultas c
        LEFT JOIN PARENTESCO p ON c.parentesco = p.parentesco
        LEFT JOIN proveedores pr ON c.claveusuario = pr.claveproveedor
        LEFT JOIN especialidades e ON pr.claveespecialidad = e.claveespecialidad
        WHERE c.claveconsulta = @claveconsulta
      `;

      //* Ejecutar la consulta
      const result = await request.query(consultaQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Consulta no encontrada" });
      }

      //* Retornar los datos procesados
      res.status(200).json({ data: result.recordset[0] });
    } catch (error) {
      console.error("Error al obtener detalles de la consulta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ message: `Método ${req.method} no permitido` });
  }
}
