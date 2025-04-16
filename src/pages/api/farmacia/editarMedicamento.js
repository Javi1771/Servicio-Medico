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
  if (req.method === "PUT") {
    // ===========================================================
    // Se añade "precio" a la desestructuración de req.body
    // ===========================================================
    const {
      id,
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

    //* Verificar campos obligatorios
    //  Incluimos precio si es requisito
    if (
      id == null ||
      medicamento == null ||
      clasificacion == null ||
      presentacion == null ||
      ean == null ||
      piezas == null ||
      maximo == null ||
      minimo == null ||
      medida == null ||
      precio == null // <-- Validar precio
    ) {
      console.error("Faltan campos obligatorios:", {
        id,
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
      // console.log("Iniciando actualización con los siguientes datos:", {
      //   id,
      //   medicamento,
      //   clasificacion,
      //   presentacion,
      //   ean,
      //   piezas,
      //   maximo,
      //   minimo,
      //   medida,
      //   precio
      // });

      const pool = await connectToDatabase();

      // =========================================================
      // Añadimos la columna "precio" en la sentencia de UPDATE
      // =========================================================
      const query = `
        UPDATE MEDICAMENTOS
        SET medicamento = @medicamento, 
            clasificacion = @clasificacion, 
            presentacion = @presentacion, 
            ean = @ean, 
            piezas = @piezas,
            maximo = @maximo,
            minimo = @minimo,
            medida = @medida,
            precio = @precio   -- <-- Aquí agregamos la columna precio
        WHERE claveMedicamento = @id
      `;

      const request = pool.request();
      request.input("id", sql.Int, id);
      request.input("medicamento", sql.VarChar, medicamento);
      request.input("clasificacion", sql.NVarChar(1), clasificacion);
      request.input("presentacion", sql.Int, presentacion);
      request.input("ean", sql.VarChar, ean);
      request.input("piezas", sql.Int, piezas);
      request.input("maximo", sql.Int, maximo);
      request.input("minimo", sql.Int, minimo);
      request.input("medida", sql.Int, medida);
      // ====================================================================
      // Se sugiere manejar precio como DECIMAL(18,2) (o similar) en tu DB
      // ====================================================================
      request.input("precio", sql.Decimal(18, 2), precio);

      //console.log("Ejecutando query de actualización:", query);
      const result = await request.query(query);
      //console.log("Resultado de la actualización:", result);

      if (result.rowsAffected[0] > 0) {
        //console.log("✅ Medicamento actualizado correctamente, ID:", id);

        // ===========================
        // Registrar la actividad
        // ===========================
        try {
          const idUsuario = getUserIdFromCookie(req);
          let ip =
            (req.headers["x-forwarded-for"] &&
              req.headers["x-forwarded-for"].split(",")[0].trim()) ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            (req.connection?.socket
              ? req.connection.socket.remoteAddress
              : null);

          const userAgent = req.headers["user-agent"] || "";

          if (idUsuario) {
            await pool
              .request()
              .input("idUsuario", sql.Int, idUsuario)
              .input("accion", sql.VarChar, "Editó un medicamento")
              .input("direccionIP", sql.VarChar, ip)
              .input("agenteUsuario", sql.VarChar, userAgent)
              .input("idMedicamento", sql.VarChar, id.toString())
              .query(`
                INSERT INTO ActividadUsuarios 
                  (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdMedicamento)
                VALUES 
                  (@idUsuario, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idMedicamento)
              `);

            //console.log("✅ Actividad registrada en la tabla ActividadUsuarios.");
          } else {
            // console.log(
            //   "⚠️ No se pudo registrar la actividad: falta idUsuario (cookie)."
            // );
          }
        } catch (errorAct) {
          console.error("❌ Error al registrar la actividad:", errorAct);
        }

        return res
          .status(200)
          .json({ message: "Medicamento editado correctamente." });
      } else {
        console.warn("⚠️ No se encontró medicamento con el ID:", id);
        return res.status(404).json({ message: "Medicamento no encontrado." });
      }
    } catch (error) {
      console.error("❌ Error al editar medicamento:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
