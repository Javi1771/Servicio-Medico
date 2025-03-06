import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { claveConsulta, diagnostico, motivoconsulta, claveusuario, clavenomina, clavepaciente } = req.body;

    try {
      const pool = await connectToDatabase();
      const transaction = new sql.Transaction(pool); // Crear una transacción

      // Obtener el valor de la cookie 'costo'
      const cookies = req.headers.cookie || "";
      const costoCookie = cookies
        .split("; ")
        .find((row) => row.startsWith("costo="))
        ?.split("=")[1];
      const costo = costoCookie ? parseFloat(costoCookie) : null;

      // Validar campos obligatorios mínimos
      if (!claveConsulta || !diagnostico || !motivoconsulta || costo === null) {
        return res
          .status(400)
          .json({ message: "Datos incompletos o inválidos." });
      }

      await transaction.begin(); // Iniciar la transacción

      // Construir la lista de columnas y valores a actualizar en la tabla "consultas"
      const sets = [
        "diagnostico = @diagnostico",
        "motivoconsulta = @motivoconsulta",
        "costo = @costo"
      ];
      const request = transaction.request()
        .input("claveConsulta", sql.Int, claveConsulta)
        .input("diagnostico", sql.Text, diagnostico)
        .input("motivoconsulta", sql.Text, motivoconsulta)
        .input("costo", sql.Decimal(10, 2), costo);

      // Agregar claveusuario y claveproveedor si se envía
      if (claveusuario !== undefined) {
        sets.push("claveusuario = @claveusuario", "claveproveedor = @claveusuario");
        request.input("claveusuario", sql.Int, claveusuario);
      }

      // Generar el query de actualización en la tabla "consultas"
      const query = `
        UPDATE consultas
        SET ${sets.join(", ")}
        WHERE claveConsulta = @claveConsulta
      `;
      await request.query(query);
      await transaction.commit(); // Confirmar la transacción

      console.log("✅ Consulta ejecutada exitosamente. Se actualizó la consulta con clave:", claveConsulta);

      // 5) Obtener la claveConsulta del último registro en "consultas" que coincida con clavenomina y clavepaciente
      let fetchedClaveConsulta = null;
      const consultaQuery = `
        SELECT TOP 1 claveConsulta
        FROM consultas
        WHERE clavenomina = @clavenomina AND clavepaciente = @clavepaciente
        ORDER BY claveConsulta DESC
      `;
      const consultaResult = await pool.request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .query(consultaQuery);
      if (consultaResult.recordset.length > 0) {
        fetchedClaveConsulta = consultaResult.recordset[0].claveConsulta;
        console.log("🔑 ClaveConsulta obtenida:", fetchedClaveConsulta);
      } else {
        console.log("No se encontró claveConsulta en consultas.");
      }

      // 6) Registrar la actividad con el mensaje "KPI calificado" e insertar la claveConsulta obtenida
      try {
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"] || "";
        await pool.request()
          .input("userId", sql.Int, Number(claveusuario))
          .input("accion", sql.VarChar, "KPI calificado")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, fetchedClaveConsulta)
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        console.log("Actividad de KPI calificado registrada.");
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      res.status(200).json({
        message: "KPI actualizado correctamente. KPI calificado.",
        claveConsulta: fetchedClaveConsulta,
      });
    } catch (error) {
      console.error("Error al actualizar KPI:", error);
      res.status(500).json({ message: "Error interno del servidor.", error });
    }
  } else {
    console.log("❌ Método no permitido:", req.method);
    res.status(405).json({ message: "Método no permitido." });
  }
}
