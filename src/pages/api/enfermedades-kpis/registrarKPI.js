import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      id_enf_cronica,
      clavenomina,
      clavepaciente,
      valor_actual,
      valor_objetivo,
      calificacion,
      valor_alcanzado,
      id_kpi,
    } = req.body;

    //? 1) Obtener la cookie 'claveusuario' de forma manual
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie || null;
    //console.log("Cookie claveusuario:", claveusuario);

    //? 2) Verificar datos obligatorios
    if (
      !id_enf_cronica ||
      !clavenomina ||
      !clavepaciente ||
      valor_actual === undefined ||
      valor_objetivo === undefined
    ) {
      console.error("Error: Faltan datos obligatorios", {
        id_enf_cronica,
        clavenomina,
        clavepaciente,
        valor_actual,
        valor_objetivo,
        id_kpi,
      });
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    //* Si no se recibe calificación, se establece por defecto
    const finalCalificacion = calificacion || "SIN CALIFICAR";

    //console.log("Datos individuales recibidos en el servidor:");
    //console.log("id_kpi:", id_kpi);
    //console.log("id_enf_cronica:", id_enf_cronica);
    //console.log("clavenomina:", clavenomina);
    //console.log("clavepaciente:", clavepaciente);
    //console.log("valor_actual:", valor_actual);
    //console.log("valor_objetivo:", valor_objetivo);
    //console.log("calificacion:", finalCalificacion);
    console.log("valor_alcanzado:", valor_alcanzado);

    try {
      const pool = await connectToDatabase();

      //* Inserción en REGISTROS_KPIS (se mantiene igual)
      const query = `
        INSERT INTO REGISTROS_KPIS (
          id_kpi,
          clavenomina,
          valor_actual,
          valor_objetivo,
          fecha_registro,
          id_enf_cronica,
          clavepaciente,
          clave_registro,
          calificacion
        )
        VALUES (
          @id_kpi,
          @clavenomina,
          @valor_actual,
          @valor_objetivo,
          GETDATE(),
          @id_enf_cronica,
          @clavepaciente,
          @clave_registro,
          @calificacion
        )
      `;
      await pool
        .request()
        .input("id_kpi", sql.Int, id_kpi)
        .input("id_enf_cronica", sql.Int, id_enf_cronica)
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .input("valor_actual", sql.Decimal(10, 2), valor_actual)
        .input("valor_objetivo", sql.Decimal(10, 2), valor_objetivo)
        .input("clave_registro", sql.VarChar, claveusuario) //* Se usa la cookie original
        .input("calificacion", sql.VarChar, finalCalificacion)
        .query(query);

      //* Obtener la claveConsulta del último registro en la tabla "consultas"
      //* que coincida con clavenomina y clavepaciente
      const consultaSelectQuery = `
        SELECT TOP 1 claveConsulta
        FROM consultas
        WHERE clavenomina = @clavenomina AND clavepaciente = @clavepaciente
        ORDER BY claveConsulta DESC
      `;
      const consultaResult = await pool
        .request()
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .query(consultaSelectQuery);

      if (consultaResult.recordset.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontró consulta asociada" });
      }
      const fetchedClaveConsulta = consultaResult.recordset[0].claveConsulta;
      //console.log("🔑 ClaveConsulta obtenida:", fetchedClaveConsulta);

      //* Registrar la actividad en la tabla ActividadUsuarios
      try {
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        const userAgent = req.headers["user-agent"] || "";
        await pool
          .request()
          .input("userId", sql.Int, Number(claveusuario))
          .input("accion", sql.VarChar, "Registró un KPI")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, fetchedClaveConsulta).query(`
            INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        //console.log("Actividad registrada en la base de datos.");
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      res.status(201).json({
        message: "KPI registrado exitosamente",
        claveConsulta: fetchedClaveConsulta,
      });
    } catch (error) {
      console.error("Error al registrar KPI en la base de datos:", error);
      res.status(500).json({ message: "Error al registrar KPI", error });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
