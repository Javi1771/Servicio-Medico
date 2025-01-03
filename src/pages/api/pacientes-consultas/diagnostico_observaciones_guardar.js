import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { claveConsulta, diagnostico, motivoconsulta, claveusuario } = req.body;

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool); //? Crear una transacción

      //* Obtener el valor de la cookie 'costo'
      const cookies = req.headers.cookie || "";
      const costoCookie = cookies
        .split("; ")
        .find((row) => row.startsWith("costo="))
        ?.split("=")[1];

      const costo = costoCookie ? parseFloat(costoCookie) : null;

      //! Validar campos obligatorios mínimos
      if (!claveConsulta || !diagnostico || !motivoconsulta || costo === null) {
        return res
          .status(400)
          .json({ message: "Datos incompletos o inválidos." });
      }

      await transaction.begin(); //? Iniciar la transacción

      //* Construir la lista de columnas y valores dinámicos
      const sets = [
        "diagnostico = @diagnostico",
        "motivoconsulta = @motivoconsulta",
        "costo = @costo",
      ];
      const request = transaction.request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("diagnostico", sql.Text, diagnostico)
        .input("motivoconsulta", sql.Text, motivoconsulta)
        .input("costo", sql.Decimal(10, 2), costo);

      //* Agregar claveusuario y claveproveedor si están definidos
      if (claveusuario !== undefined) {
        sets.push("claveusuario = @claveusuario", "claveproveedor = @claveusuario");
        request.input("claveusuario", sql.Int, claveusuario);
      }

      //* Generar el query de actualización
      const query = `
        UPDATE consultas
        SET ${sets.join(", ")}
        WHERE claveConsulta = @claveConsulta
      `;

      //* Ejecutar el query
      await request.query(query);

      await transaction.commit(); //* Confirmar la transacción

      res.status(200).json({ message: "Datos guardados correctamente." });
    } catch (error) {
      console.error("❌ Error durante la transacción:", error);

      //! Revertir la transacción en caso de error
      if (transaction.isActive) {
        await transaction.rollback();
        console.log("❌ Transacción revertida debido a un error.");
      }

      res.status(500).json({ message: "Error al procesar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
