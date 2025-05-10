import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función auxiliar para obtener la cookie "claveusuario"
function getUserIdFromCookie(req) {
  const rawCookies = req.headers.cookie || "";
  const cookie = rawCookies
    .split("; ")
    .find((c) => c.startsWith("claveusuario="));
  if (!cookie) return null;

  const claveUsuario = cookie.split("=")[1];
  return claveUsuario ? Number(claveUsuario) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Método ${req.method} no permitido` });
  }

  // =======================
  // AGREGAMOS "precio" AQUÍ
  // =======================
  const {
    medicamento,
    clasificacion,
    presentacion,
    ean,
    piezas,
    maximo,
    minimo,
    medida,
    precio // <-- Nuevo campo
  } = req.body;

  //* Validar que todos los campos estén presentes
  if (
    !medicamento ||
    clasificacion == null ||
    presentacion == null ||
    ean == null ||
    piezas == null ||
    maximo == null ||
    minimo == null ||
    medida == null ||
    precio == null
  ) {
    console.error("⚠️ Faltan datos obligatorios:", {
      medicamento,
      clasificacion,
      presentacion,
      ean,
      piezas,
      maximo,
      minimo,
      medida,
      precio
    });
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });
  }

  try {
    const dbPool = await connectToDatabase();

    //* Verificar si ya existe el medicamento por EAN o nombre
    const checkQuery = `
      SELECT COUNT(*) AS count 
      FROM MEDICAMENTOS 
      WHERE ean = @ean OR medicamento = @medicamento
    `;
    const checkResult = await dbPool
      .request()
      .input("ean", sql.VarChar, ean)
      .input("medicamento", sql.VarChar, medicamento)
      .query(checkQuery);

    if (checkResult.recordset[0].count > 0) {
      console.warn("⚠️ El medicamento ya está registrado:", medicamento, ean);
      return res
        .status(400)
        .json({ message: "El medicamento ya está registrado." });
    }

    //* Consultar el último valor de claveMedicamento convirtiéndolo a int
    const claveQuery = `
      SELECT TOP 1 CONVERT(int, claveMedicamento) AS claveInt
      FROM MEDICAMENTOS
      ORDER BY CONVERT(int, claveMedicamento) DESC
    `;
    const claveResult = await dbPool.request().query(claveQuery);
    const newClaveMedicamentoInt =
      (claveResult.recordset[0]?.claveInt || 0) + 1;
    const newClaveMedicamento = newClaveMedicamentoInt.toString();

    // ======================================================
    //* AÑADIMOS LA COLUMNA "precio" AL INSERT Y AL VALUES
    // ======================================================
    const insertQuery = `
      INSERT INTO MEDICAMENTOS 
        (claveMedicamento, medicamento, clasificacion, presentacion, ean, piezas, maximo, minimo, medida, precio, estatus)
      VALUES 
        (@claveMedicamento, @medicamento, @clasificacion, @presentacion, @ean, @piezas, @maximo, @minimo, @medida, @precio, @estatus);
    `;

    //* Intentamos el INSERT y capturamos violaciones de índice único
    try {
      await dbPool
        .request()
        .input("claveMedicamento", sql.VarChar, newClaveMedicamento)
        .input("medicamento", sql.VarChar, medicamento)
        .input("clasificacion", sql.NVarChar(1), clasificacion)
        .input("presentacion", sql.Int, presentacion)
        .input("ean", sql.VarChar, ean)
        .input("piezas", sql.Int, piezas)
        .input("maximo", sql.Int, maximo)
        .input("minimo", sql.Int, minimo)
        .input("medida", sql.Int, medida)
        .input("precio", sql.Decimal(18, 2), precio)
        .input("estatus", sql.Bit, 1)
        .query(insertQuery);
    } catch (insertError) {
      //! SQL Server: 2627 o 2601 = violación de UNIQUE constraint
      const errNum = insertError.number || insertError.originalError?.info?.number;
      if (errNum === 2627 || errNum === 2601) {
        return res
          .status(400)
          .json({ message: "El medicamento ya está registrado." });
      }
      //! Si es otro error, lo dejamos caer al catch global
      throw insertError;
    }

    //* Insertar la actividad en la tabla ActividadUsuarios
    try {
      const idUsuario = getUserIdFromCookie(req);
      let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);
      const userAgent = req.headers["user-agent"] || "";

      if (idUsuario) {
        await dbPool
          .request()
          .input("idUsuario", sql.Int, idUsuario)
          .input("accion", sql.VarChar, "Creó un nuevo medicamento")
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("idMedicamento", sql.VarChar, newClaveMedicamento)
          .query(`
            INSERT INTO ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdMedicamento)
            VALUES 
              (@idUsuario, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idMedicamento)
          `);
      }
    } catch (errorAct) {
      console.error("❌ Error al registrar la actividad:", errorAct);
    }

    //* Respuesta final al cliente
    return res.status(200).json({
      message: "Medicamento registrado exitosamente",
      claveMedicamento: newClaveMedicamento,
    });
  } catch (error) {
    console.error("❌ Error al registrar medicamento:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor" });
  }
}
