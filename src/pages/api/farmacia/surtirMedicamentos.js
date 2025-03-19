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

  console.log("📌 Datos recibidos en la API:");
  console.log(`   🔹 Folio: ${folioSurtimiento}`);
  console.log(`   🔹 Receta Completada: ${recetaCompletada}`);
  console.log(`   🔹 Costo: ${cost}`);
  console.log(`   🔹 Fecha Despacho Recibida: ${fechaDespacho}`);
  console.log("   🔹 Detalle recibido:", detalle);

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
      //* 🔹 Actualizar stock y detalleSurtimientos para cada detalle
      for (const item of detalle) {
        const delta = item.delta;

        if (delta > 0) {
          console.log(
            `📌 Actualizando stock de medicamento ${item.claveMedicamento}`
          );
          console.log(`   🔹 Descontando ${delta} piezas`);

          const updateMed = `
            UPDATE medicamentos
            SET piezas = piezas - @delta
            WHERE claveMedicamento = @claveMedicamento
          `;
          await transaction
            .request()
            .input("delta", sql.Int, delta)
            .input("claveMedicamento", sql.NVarChar(50), item.claveMedicamento)
            .query(updateMed);
        }

        console.log(
          `📌 Actualizando detalleSurtimientos ID ${item.idSurtimiento}`
        );
        console.log(`   🔹 Nuevo estatus: ${item.estatus}`);
        console.log(`   🔹 Cantidad entregada: ${item.delivered}`);

        const updateDetalle = `
          UPDATE detalleSurtimientos
          SET estatus = @estatus,
              entregado = @delivered
          WHERE idSurtimiento = @idSurtimiento
        `;
        await transaction
          .request()
          .input("estatus", sql.Int, item.estatus)
          .input("delivered", sql.Int, item.delivered)
          .input("idSurtimiento", sql.Int, item.idSurtimiento)
          .query(updateDetalle);
      }

      //* 🔹 Si la receta está completada, actualizar el estatus del surtimiento
      if (recetaCompletada) {
        console.log(
          `📌 Actualizando SURTIMIENTOS - Folio: ${folioSurtimiento}`
        );
        console.log(`   🔹 Nuevo estatus: 0`);
        console.log(`   🔹 Fecha despacho a guardar: ${fechaDespacho}`);
        console.log(`   🔹 Costo: ${cost || 0}`);

        const updateSurtimiento = `
          UPDATE SURTIMIENTOS
          SET ESTATUS = 0,
              FECHA_DESPACHO = @fechaDespacho,
              COSTO = @cost
          WHERE FOLIO_SURTIMIENTO = @folio
        `;

        console.log("🟢 Ejecutando UPDATE en SURTIMIENTOS...");

        const updateResult = await transaction
          .request()
          .input("folio", sql.Int, folioSurtimiento)
          .input("fechaDespacho", sql.VarChar, fechaDespacho) //* Maneja el tipo que uses en tu DB
          .input("cost", sql.Numeric(18, 2), cost || 0)
          .query(updateSurtimiento);

        console.log("✅ Resultado del UPDATE en SURTIMIENTOS:", updateResult);
      } else {
        console.log("⚠️ Receta NO completada, no se actualizó SURTIMIENTOS.");
      }

      //* 👇 Finaliza la transacción con éxito
      await transaction.commit();
      console.log(
        `✅ Transacción completada con éxito para folio ${folioSurtimiento}`
      );

      //* ======================
      //* Registrar la actividad
      //* ======================
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
          //* Inserta en ActividadUsuarios, usando la columna IdSurtimiento
          //* para almacenar el folioSurtimiento recién procesado
          await db
            .request()
            .input("IdUsuario", sql.Int, idUsuario)
            .input("Accion", sql.VarChar, "Surtió una receta")
            .input("DireccionIP", sql.VarChar, ip)
            .input("AgenteUsuario", sql.VarChar, userAgent)
            .input("IdSurtimiento", sql.Int, folioSurtimiento).query(`
              INSERT INTO ActividadUsuarios
                (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdSurtimiento)
              VALUES
                (@IdUsuario, @Accion, GETDATE(), @DireccionIP, @AgenteUsuario, @IdSurtimiento)
            `);
          console.log("✅ Actividad registrada en la tabla ActividadUsuarios.");
        } else {
          console.log(
            "⚠️ No se pudo registrar la actividad: falta idUsuario (cookie)."
          );
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
