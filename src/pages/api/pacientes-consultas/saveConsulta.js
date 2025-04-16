import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para parsear cookies del header
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split("; ").reduce((acc, cookieStr) => {
    const [key, value] = cookieStr.split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const consultaData = req.body;

    try {
      //console.log("📥 Datos recibidos en el backend:", consultaData);

      //* Conexión a la base de datos
      const pool = await connectToDatabase();
      //console.log("✅ Conexión a la base de datos establecida.");

      //* Si clavepaciente es nulo, usa clavenomina como valor predeterminado y conviértelo a string
      const clavePaciente = (
        consultaData.clavepaciente ?? consultaData.clavenomina
      ).toString();
      //console.log("🔑 Valor de clavePaciente (como cadena):", clavePaciente);

      //* Preparación de la inserción. Para campos numéricos se valida si es cadena vacía y se asigna null.
      const request = pool.request();
      request
        .input("fechaconsulta", sql.VarChar, consultaData.fechaconsulta)
        .input("clavenomina", sql.VarChar, consultaData.clavenomina)
        .input(
          "presionarterialpaciente",
          sql.VarChar,
          consultaData.presionarterialpaciente === ""
            ? null
            : consultaData.presionarterialpaciente
        )
        .input(
          "temperaturapaciente",
          sql.VarChar,
          consultaData.temperaturapaciente === ""
            ? null
            : consultaData.temperaturapaciente
        )
        .input(
          "pulsosxminutopaciente",
          sql.VarChar,
          consultaData.pulsosxminutopaciente === ""
            ? null
            : consultaData.pulsosxminutopaciente
        )
        .input(
          "respiracionpaciente",
          sql.VarChar,
          consultaData.respiracionpaciente === ""
            ? null
            : consultaData.respiracionpaciente
        )
        .input(
          "estaturapaciente",
          sql.VarChar,
          consultaData.estaturapaciente === ""
            ? null
            : consultaData.estaturapaciente
        )
        .input(
          "pesopaciente",
          sql.VarChar,
          consultaData.pesopaciente === "" ? null : consultaData.pesopaciente
        )
        .input(
          "glucosapaciente",
          sql.VarChar,
          consultaData.glucosapaciente === ""
            ? null
            : consultaData.glucosapaciente
        )
        .input("nombrepaciente", sql.VarChar, consultaData.nombrepaciente)
        .input("edad", sql.VarChar, consultaData.edad)
        .input("clavestatus", sql.Int, consultaData.clavestatus)
        .input(
          "elpacienteesempleado",
          sql.VarChar,
          consultaData.elpacienteesempleado
        )
        .input("parentesco", sql.Int, consultaData.parentesco)
        .input("clavepaciente", sql.VarChar, clavePaciente)
        .input("departamento", sql.VarChar, consultaData.departamento)
        .input("sindicato", sql.VarChar, consultaData.sindicato);

      // console.log(
      //   "📤 Datos preparados para la consulta SQL:",
      //   request.parameters
      // );

      const result = await request.query(`
        INSERT INTO consultas (
          fechaconsulta, clavenomina, presionarterialpaciente, temperaturapaciente, 
          pulsosxminutopaciente, respiracionpaciente, estaturapaciente, pesopaciente, 
          glucosapaciente, nombrepaciente, edad, clavestatus, elpacienteesempleado, 
          parentesco, clavepaciente, departamento, sindicato
        ) VALUES (
          @fechaconsulta, @clavenomina, @presionarterialpaciente, @temperaturapaciente, 
          @pulsosxminutopaciente, @respiracionpaciente, @estaturapaciente, @pesopaciente, 
          @glucosapaciente, @nombrepaciente, @edad, @clavestatus, @elpacienteesempleado, 
          @parentesco, @clavepaciente, @departamento, @sindicato
        );
        SELECT SCOPE_IDENTITY() AS claveConsulta;
      `);

      //console.log("✅ Consulta ejecutada exitosamente. Resultados:", result);

      const claveConsulta = result.recordset[0].claveConsulta;
      //console.log("🔑 Nueva clave de consulta generada:", claveConsulta);

      //* Registrar la actividad (por ejemplo, "Consulta de signos vitales guardada")
      try {
        const cookies = parseCookies(req.headers.cookie);
        //* Usar la cookie 'claveusuario' si existe, sino se usa el valor de clavePaciente
        const idUsuario = cookies.claveusuario
          ? Number(cookies.claveusuario)
          : Number(clavePaciente);
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        const userAgent = req.headers["user-agent"] || "";
        await pool
          .request()
          .input("userId", sql.Int, idUsuario)
          .input("accion", sql.VarChar, "Consulta de signos vitales guardada")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("claveConsulta", sql.Int, claveConsulta).query(`
            INSERT INTO dbo.ActividadUsuarios (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        //console.log("Actividad registrada en la base de datos.");
      } catch (errorRegistro) {
        console.error("Error registrando actividad:", errorRegistro);
      }

      //* Emitir un evento a través de Socket.io para notificar la actividad
      if (res.socket && res.socket.server && res.socket.server.io) {
        res.socket.server.io.emit("consulta-guardada", {
          claveConsulta,
          accion: "Consulta de signos vitales guardada",
          time: new Date().toISOString(),
        });
        //console.log("Evento 'consulta-guardada' emitido.");
      } else {
        //console.log("Socket.io no está disponible en res.socket.server.io");
      }

      res.status(200).json({
        message: "Consulta guardada correctamente.",
        claveConsulta,
      });
    } catch (error) {
      console.error("❌ Error al guardar la consulta:", error);
      res.status(500).json({ message: "Error al guardar la consulta." });
    }
  } else {
    //console.log("❌ Método no permitido:", req.method);
    res.status(405).json({ message: "Método no permitido." });
  }
}
