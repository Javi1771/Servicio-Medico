import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    //? 1) Obtener la cookie 'claveusuario' de forma manual
    const rawCookies = req.headers.cookie || "";
    const claveusuarioCookie = rawCookies
      .split("; ")
      .find((row) => row.startsWith("claveusuario="))
      ?.split("=")[1];
    const claveusuario = claveusuarioCookie || null;
    //console.log("Cookie claveusuario:", claveusuario);

    //? 2) Desestructuramos los datos del body
    //* Se intenta también leer de req.query en caso de que se envíen como parámetros
    const {
      id_registro_kpi,
      valor_alcanzado,
      calificacion,
      observaciones,
      fecha_evaluacion,
      clavenomina: bodyClavenomina,
      clavepaciente: bodyClavepaciente,
      claveConsulta: bodyClaveConsulta,
    } = req.body;
    const clavenomina = bodyClavenomina || req.query.clavenomina;
    const clavepaciente = bodyClavepaciente || req.query.clavepaciente;
    let claveConsulta = bodyClaveConsulta || req.query.claveConsulta || null;

    //console.log("Datos recibidos en el backend:", { id_registro_kpi, valor_alcanzado, calificacion, observaciones, fecha_evaluacion, clavenomina, clavepaciente, claveConsulta, });

    //? 3) Validar datos obligatorios
    if (
      !id_registro_kpi ||
      valor_alcanzado === undefined ||
      calificacion === undefined ||
      !fecha_evaluacion
    ) {
      return res.status(400).json({
        message: "Faltan datos obligatorios",
        datos_recibidos: {
          id_registro_kpi,
          valor_alcanzado,
          calificacion,
          observaciones,
          fecha_evaluacion,
        },
      });
    }

    try {
      const pool = await connectToDatabase();

      //? 4) Ejecutar el UPDATE en REGISTROS_KPIS
      const query = `
        UPDATE REGISTROS_KPIS
        SET valor_alcanzado = @valor_alcanzado,
            calificacion = @calificacion,
            observaciones = @observaciones,
            fecha_evaluacion = @fecha_evaluacion,
            clave_evaluo = @clave_evaluo
        WHERE id_registro_kpi = @id_registro_kpi
      `;
      //console.log("Ejecutando consulta SQL con datos:", { id_registro_kpi, valor_alcanzado, calificacion, observaciones, fecha_evaluacion, claveusuario, });

      const result = await pool
        .request()
        .input("valor_alcanzado", sql.Decimal(10, 2), valor_alcanzado)
        .input("calificacion", sql.VarChar, calificacion)
        .input("observaciones", sql.VarChar, observaciones)
        .input("fecha_evaluacion", sql.VarChar, fecha_evaluacion)
        //* Se usa la cookie claveusuario para el campo clave_evaluo
        .input("clave_evaluo", sql.VarChar, claveusuario)
        .input("id_registro_kpi", sql.Int, id_registro_kpi)
        .query(query);

      if (result.rowsAffected[0] === 0) {
        return res
          .status(404)
          .json({ message: "No se encontró el KPI especificado." });
      }

      //? 5) Si no se recibió la claveConsulta desde el front, se busca en la tabla "consultas"
      if (!claveConsulta && clavenomina && clavepaciente) {
        const consultaQuery = `
          SELECT TOP 1 claveConsulta
          FROM consultas
          WHERE clavenomina = @clavenomina AND clavepaciente = @clavepaciente
          ORDER BY claveConsulta DESC
        `;
        const consultaResult = await pool
          .request()
          .input("clavenomina", sql.VarChar, clavenomina)
          .input("clavepaciente", sql.VarChar, clavepaciente)
          .query(consultaQuery);
        if (consultaResult.recordset.length > 0) {
          claveConsulta = consultaResult.recordset[0].claveConsulta;
          //console.log("🔑 ClaveConsulta obtenida:", claveConsulta);
        } else {
          //console.log( "No se encontró consulta asociada a clavenomina y clavepaciente." );
        }
      } else {
        //console.log("ClaveConsulta recibida desde el front:", claveConsulta);
      }

      //? 6) Registrar la actividad con el mensaje "KPI calificado" e insertar la claveConsulta obtenida
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
          .input("accion", sql.VarChar, "Calificó un KPI")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, claveConsulta).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        //console.log("Actividad de KPI calificado registrada.");
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      res.status(200).json({
        message: "KPI actualizado correctamente. KPI calificado.",
        claveConsulta: claveConsulta,
      });
    } catch (error) {
      console.error("Error al actualizar KPI:", error);
      res.status(500).json({ message: "Error interno del servidor.", error });
    }
  } else {
    //console.log("❌ Método no permitido:", req.method);
    res.status(405).json({ message: "Método no permitido." });
  }
}
