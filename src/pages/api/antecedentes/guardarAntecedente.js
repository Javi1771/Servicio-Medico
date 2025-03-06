import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

// Función para parsear las cookies del header
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split("; ").reduce((acc, cookieStr) => {
    const [key, value] = cookieStr.split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    descripcion,
    clavenomina,
    clavepaciente,
    tipoAntecedente,
    fechaInicioEnfermedad,
  } = req.body;

  // Validar datos obligatorios
  if (!descripcion || !clavenomina || !clavepaciente || !tipoAntecedente || !fechaInicioEnfermedad) {
    return res.status(400).json({ message: "Datos incompletos." });
  }

  try {
    const pool = await connectToDatabase();

    // Insertar el antecedente y obtener el ID insertado con SCOPE_IDENTITY()
    const result = await pool.request()
      .input("descripcion", sql.NVarChar(sql.MAX), descripcion)
      .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
      .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente)
      .input("tipo_antecedente", sql.NVarChar(sql.MAX), tipoAntecedente)
      .input("fecha_inicio_enfermedad", sql.DateTime, fechaInicioEnfermedad)
      .query(`
        INSERT INTO antecedentes_clinicos 
          (descripcion, clavenomina, clavepaciente, tipo_antecedente, fecha_inicio_enfermedad)
        VALUES 
          (@descripcion, @clavenomina, @clavepaciente, @tipo_antecedente, @fecha_inicio_enfermedad);
        SELECT SCOPE_IDENTITY() AS idAntecedente;
      `);

    const idAntecedente = result.recordset[0].idAntecedente;
    console.log("🔑 Nuevo antecedente insertado con id:", idAntecedente);

    // Registrar la actividad "Asignó antecedente" en la tabla ActividadUsuarios
    try {
      const cookies = parseCookies(req.headers.cookie);
      // Usamos la cookie "claveusuario", o null si no existe
      const claveusuario = cookies.claveusuario ? Number(cookies.claveusuario) : null;
      if (claveusuario !== null) {
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"] || "";
        await pool.request()
          .input("userId", sql.Int, claveusuario)
          .input("accion", sql.VarChar, "Guardó un antecedente")
          // Se guarda la nueva clave de antecedente en la columna ClaveConsulta
          .input("claveConsulta", sql.Int, idAntecedente)
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
          `);
        console.log("Actividad 'Asignó antecedente' registrada en ActividadUsuarios.");
      } else {
        console.log("Cookie 'claveusuario' no encontrada; no se registró la actividad.");
      }
    } catch (errorRegistro) {
      console.error("Error registrando actividad:", errorRegistro);
    }

    // Opcional: Obtener historial actualizado de antecedentes (si deseas retornarlo)
    const resultHist = await pool.request()
      .input("clavenomina", sql.NVarChar(sql.MAX), clavenomina)
      .input("clavepaciente", sql.NVarChar(sql.MAX), clavepaciente)
      .query(`
        SELECT 
          id_antecedente,
          descripcion,
          clavenomina,
          tipo_antecedente,
          fecha_registro,
          fecha_inicio_enfermedad
        FROM antecedentes_clinicos
        WHERE clavenomina = @clavenomina
          AND clavepaciente = @clavepaciente
      `);

    const historial = resultHist.recordset;

    res.status(200).json({
      message: "Antecedente guardado correctamente.",
      nuevoAntecedente: historial,
    });
  } catch (error) {
    console.error("Error al guardar el antecedente:", error);
    res.status(500).json({ message: "Error al guardar el antecedente.", error });
  }
}
