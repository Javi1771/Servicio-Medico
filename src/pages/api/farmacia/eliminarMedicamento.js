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
  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "ID del medicamento es requerido." });
    }

    try {
      const pool = await connectToDatabase();
      //* Borrado lógico en lugar de DELETE
      const query = `
        UPDATE MEDICAMENTOS
        SET estatus = 0
        WHERE claveMedicamento = @id
      `;
      const result = await pool.request().input("id", sql.Int, id).query(query);

      //* Verificamos si se afectó al menos un registro
      if (result.rowsAffected[0] > 0) {
        // console.log(
        //   "✅ Medicamento marcado como inactivo (borrado lógico), ID:",
        //   id
        // );

        //* ===========================
        //* Registrar la actividad
        //* ===========================
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
              .input("accion", sql.VarChar, "Eliminó un medicamento")
              //* Puedes usar GETDATE() en SQL para la fecha/hora
              .input("direccionIP", sql.VarChar, ip)
              .input("agenteUsuario", sql.VarChar, userAgent)
              .input("idMedicamento", sql.VarChar, id.toString()).query(`
                INSERT INTO ActividadUsuarios 
                  (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdMedicamento)
                VALUES 
                  (@idUsuario, @accion, GETDATE(), @direccionIP, @agenteUsuario, @idMedicamento)
              `);

            // console.log(
            //   "✅ Actividad de ‘Eliminó un medicamento’ registrada en ActividadUsuarios."
            // );
          } else {
            // console.log(
            //   "⚠️ No se pudo registrar la actividad: falta idUsuario (cookie)."
            // );
          }
        } catch (errorAct) {
          console.error("❌ Error registrando actividad:", errorAct);
        }

        res.status(200).json({
          message: "Medicamento eliminado (borrado lógico) correctamente.",
        });
      } else {
        res.status(404).json({ message: "Medicamento no encontrado." });
      }
    } catch (error) {
      console.error("Error al realizar borrado lógico de medicamento:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).json({ message: `Método ${req.method} no permitido.` });
  }
}
