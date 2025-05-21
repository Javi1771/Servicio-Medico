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
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folioSurtimiento, detalle, recetaCompletada, cost, fechaDespacho } =
    req.body;

  if (!folioSurtimiento || !detalle) {
    return res
      .status(400)
      .json({ message: "folioSurtimiento y detalle son requeridos" });
  }

  try {
    const db = await connectToDatabase();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    try {
      // 1) Actualizar stock y detalleSurtimientos
      for (const item of detalle) {
        const { delta, claveMedicamento, estatus, delivered, idSurtimiento } =
          item;

        if (delta > 0) {
          await transaction
            .request()
            .input("delta", sql.Int, delta)
            .input("claveMedicamento", sql.NVarChar(50), claveMedicamento)
            .query(`
              UPDATE medicamentos
              SET piezas = piezas - @delta
              WHERE claveMedicamento = @claveMedicamento
            `);
        }

        await transaction
          .request()
          .input("estatus", sql.Int, estatus)
          .input("delivered", sql.Int, delivered)
          .input("idSurtimiento", sql.Int, idSurtimiento)
          .query(`
            UPDATE detalleSurtimientos
            SET estatus   = @estatus,
                entregado = @delivered
            WHERE idSurtimiento = @idSurtimiento
          `);
      }

      // 2) Si la receta está completada, actualizamos SURTIMIENTOS
      if (recetaCompletada) {
        // 2.1) Actualizar SURTIMIENTOS
        await transaction
          .request()
          .input("folioSurtimiento", sql.Int, folioSurtimiento)
          .input("fechaDespacho", sql.VarChar, fechaDespacho)
          .input("cost", sql.Numeric(18, 2), cost || 0)
          .query(`
            UPDATE SURTIMIENTOS
            SET ESTATUS        = 0,
                FECHA_DESPACHO = @fechaDespacho,
                COSTO          = @cost
            WHERE FOLIO_SURTIMIENTO = @folioSurtimiento
          `);

        // 2.2) Obtener el FOLIO_PASE asociado
        const folioPaseResult = await transaction
          .request()
          .input("folioSurtimiento", sql.Int, folioSurtimiento)
          .query(`
            SELECT FOLIO_PASE
            FROM SURTIMIENTOS
            WHERE FOLIO_SURTIMIENTO = @folioSurtimiento
          `);
        const folioPase = folioPaseResult.recordset[0]?.FOLIO_PASE;

        // 2.3) Incrementar surtimientoActual **por cada medicamento**,
        //      independientemente de seAsignoResurtimiento
        if (folioPase) {
          for (const item of detalle) {
            const { claveMedicamento } = item;
            await transaction
              .request()
              .input("folioPase", sql.Int, folioPase)
              .input("claveMedicamento", sql.NVarChar(50), claveMedicamento)
              .query(`
                UPDATE detalleReceta
                SET surtimientoActual = ISNULL(surtimientoActual, 0) + 1
                WHERE folioReceta     = @folioPase
                  AND descMedicamento = @claveMedicamento
              `);
          }
        }
      }

      // 3) Commit de la transacción
      await transaction.commit();

      // 4) Registrar la actividad en bitácora
      try {
        const idUsuario = getUserIdFromCookie(req);
        const ip =
          req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          null;
        const userAgent = req.headers["user-agent"] || "";

        if (idUsuario) {
          await db
            .request()
            .input("IdUsuario", sql.Int, idUsuario)
            .input("Accion", sql.VarChar, "Surtió una receta")
            .input("DireccionIP", sql.VarChar, ip)
            .input("AgenteUsuario", sql.VarChar, userAgent)
            .input("IdSurtimiento", sql.Int, folioSurtimiento)
            .query(`
              INSERT INTO ActividadUsuarios
                (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdSurtimiento)
              VALUES
                (@IdUsuario, @Accion, GETDATE(), @DireccionIP, @AgenteUsuario, @IdSurtimiento)
            `);
        }
      } catch (errorAct) {
        console.error("❌ Error al registrar la actividad:", errorAct);
      }

      return res.status(200).json({ message: "Cambios guardados con éxito" });
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Error en transacción surtirMedicamentos:", err);
      return res
        .status(500)
        .json({ message: "Error en la transacción", error: err.message });
    }
  } catch (error) {
    console.error("❌ Error conectando a DB en surtirMedicamentos:", error);
    return res.status(500).json({ message: error.message });
  }
}
