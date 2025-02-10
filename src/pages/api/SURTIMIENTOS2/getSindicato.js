import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  //* Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { claveconsulta } = req.body;

  //* Validamos que venga claveconsulta
  if (!claveconsulta) {
    return res
      .status(400)
      .json({ error: "La propiedad 'claveconsulta' es obligatoria." });
  }

  try {
    //* En este punto connectToDatabase() debe retornar el pool
    const pool = await connectToDatabase();

    //* Llamamos al request() de esa conexión
    const result = await pool
      .request()
      //* Ajusta el tipo según corresponda (sql.Int, sql.NVarChar, etc.)
      .input("claveconsulta", sql.Int, claveconsulta)
      .query(
        "SELECT sindicato FROM consultas WHERE claveconsulta = @claveconsulta"
      );

    if (!result.recordset || result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró ninguna consulta con esa clave." });
    }

    const { sindicato } = result.recordset[0];

    //* Retornamos lo que obtuvimos (o null si viene undefined)
    return res.status(200).json({
      sindicato: sindicato ?? null,
    });
  } catch (error) {
    console.error("Error en getsindicato:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener sindicato de la base de datos" });
  }
}
