import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import cookie from "cookie"; //* Para parsear las cookies

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      id_enf_cronica,
      clavenomina,
      observaciones_cronica,
      fecha_registro,
      clavepaciente,
    } = req.body;

    //* Log para verificar los datos recibidos
    // console.log(
    //   "Datos recibidos en el servidor al guardar enfermedad crónica:",
    //   {
    //     id_enf_cronica,
    //     clavenomina,
    //     observaciones_cronica,
    //     fecha_registro,
    //     clavepaciente,
    //   }
    // );

    //* Validación de datos requeridos
    if (
      !id_enf_cronica ||
      !clavenomina ||
      !observaciones_cronica ||
      !fecha_registro
    ) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    try {
      const pool = await connectToDatabase();
      const query = `
        INSERT INTO PACIENTES_CRONICOS
          (id_enf_cronica, clavenomina, observaciones_cronica, fecha_registro, clavepaciente, estatus)
        VALUES
          (@id_enf_cronica, @clavenomina, @observaciones_cronica, @fecha_registro, @clavepaciente, @estatus)
      `;

      await pool
        .request()
        .input("id_enf_cronica", id_enf_cronica)
        .input("clavenomina", clavenomina)
        .input("observaciones_cronica", observaciones_cronica)
        .input("fecha_registro", fecha_registro)
        .input("clavepaciente", clavepaciente)
        .input("estatus", 1) //* Siempre insertar un 1 en la columna 'estatus'
        .query(query);

      //console.log("✅ Enfermedad crónica registrada exitosamente");

      //* -------------------------------
      //* Registrar actividad en ActividadUsuarios
      //* -------------------------------
      try {
        //* Primero, obtenemos la cookie 'claveusuario'
        const cookies = cookie.parse(req.headers.cookie || "");
        const claveusuario = cookies.claveusuario
          ? Number(cookies.claveusuario)
          : null;
        if (!claveusuario) {
          // console.log(
          //   "Cookie 'claveusuario' no encontrada; actividad no registrada."
          // );
        } else {
          //* Consultar la tabla 'consultas' para obtener el último registro que coincida con clavenomina y clavepaciente
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
            const fetchedClaveConsulta =
              consultaResult.recordset[0].claveConsulta;
            //console.log("🔑 ClaveConsulta obtenida:", fetchedClaveConsulta);

            //* Insertar en ActividadUsuarios con la claveConsulta obtenida
            let ip =
            (req.headers["x-forwarded-for"] &&
              req.headers["x-forwarded-for"].split(",")[0].trim()) ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            (req.connection?.socket ? req.connection.socket.remoteAddress : null);
          
            const userAgent = req.headers["user-agent"] || "";
            await pool
              .request()
              .input("userId", sql.Int, claveusuario)
              .input("accion", sql.VarChar, "Asignó enfermedad crónica")
              .input("direccionIP", sql.VarChar, ip)
              .input("agenteUsuario", sql.VarChar, userAgent)
              .input("claveConsulta", sql.Int, fetchedClaveConsulta).query(`
                INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
                VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
              `);
            // console.log(
            //   "Actividad de asignación de enfermedad crónica registrada en la base de datos."
            // );
          } else {
            // console.log(
            //   "No se encontró consulta asociada para registrar la actividad."
            // );
          }
        }
      } catch (errorActividad) {
        console.error("Error registrando actividad:", errorActividad);
      }

      res
        .status(201)
        .json({ message: "Enfermedad crónica registrada exitosamente" });
    } catch (error) {
      console.error(
        "Error al registrar enfermedad crónica en la base de datos:",
        error
      );
      res
        .status(500)
        .json({ message: "Error al registrar enfermedad crónica", error });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
