import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { id_enf_cronica, kpi } = req.body;

    if (!id_enf_cronica || !kpi) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    try {
      const pool = await connectToDatabase();
      await pool
        .request()
        .input("id_enf_cronica", sql.Int, id_enf_cronica)
        .input("kpi", sql.VarChar, kpi)
        .input("estatus", sql.Bit, 1) // Estatus activo por defecto
        .query(`
          INSERT INTO KPIs (id_enf_cronica, kpi, estatus)
          VALUES (@id_enf_cronica, @kpi, @estatus)
        `);

      res.status(201).json({ message: "KPI registrado exitosamente." });
    } catch (error) {
      console.error("Error al registrar KPI:", error);
      res.status(500).json({ message: "Error al registrar el KPI." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
