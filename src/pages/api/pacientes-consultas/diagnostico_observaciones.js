import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { claveConsulta, diagnostico, motivoconsulta } = req.body;

    try {
      const pool = await connectToDatabase();

      if (claveConsulta && diagnostico && motivoconsulta) {
        await pool
          .request()
          .input("claveConsulta", sql.Int, claveConsulta)
          .input("diagnostico", sql.Text, diagnostico)
          .input("motivoconsulta", sql.Text, motivoconsulta)
          .query(`
            UPDATE consultas
            SET diagnostico = @diagnostico, motivoconsulta = @motivoconsulta
            WHERE claveConsulta = @claveConsulta
          `);
        res.status(200).json({ message: "Diagnóstico y motivo de consulta guardados correctamente." });
      } else {
        res.status(400).json({ message: "Datos incompletos o inválidos." });
      }
    } catch (error) {
      console.error("Error al procesar la consulta:", error);
      res.status(500).json({ message: "Error al procesar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
