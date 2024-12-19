import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { claveConsulta, diagnostico, motivoconsulta, claveusuario } = req.body;

    try {
      const pool = await connectToDatabase();

      // Verificar campos obligatorios mínimos
      if (!claveConsulta || !diagnostico || !motivoconsulta) {
        return res.status(400).json({ message: "Datos incompletos o inválidos." });
      }

      const sets = ["diagnostico = @diagnostico", "motivoconsulta = @motivoconsulta"];

      // Solo si claveusuario está definido, lo agregamos al UPDATE
      const request = pool.request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("diagnostico", sql.Text, diagnostico)
        .input("motivoconsulta", sql.Text, motivoconsulta);

      if (claveusuario !== undefined) {
        sets.push("claveusuario = @claveusuario");
        request.input("claveusuario", sql.Int, claveusuario);
      }

      const query = `
        UPDATE consultas
        SET ${sets.join(", ")}
        WHERE claveConsulta = @claveConsulta
      `;

      await request.query(query);

      res.status(200).json({ message: "Datos guardados correctamente." });
    } catch (error) {
      console.error("Error al procesar la consulta:", error);
      res.status(500).json({ message: "Error al procesar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
