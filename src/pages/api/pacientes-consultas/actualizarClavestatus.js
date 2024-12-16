import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import axios from "axios";

const activeRequests = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { claveConsulta, clavestatus } = req.body;

  // Validar que los datos estén completos
  if (!claveConsulta || clavestatus === undefined) {
    return res.status(400).json({ message: "Datos incompletos." });
  }

  // Validar valores permitidos para clavestatus
  if (![0, 1, 2].includes(clavestatus)) {
    return res.status(400).json({
      message: "El valor de clavestatus no es válido. Solo se permiten 0, 1 y 2.",
    });
  }

  const requestKey = `${claveConsulta}-${clavestatus}`;
  if (activeRequests.has(requestKey)) {
    return res.status(429).json({ message: "Solicitud ya en proceso." });
  }

  activeRequests.add(requestKey);

  try {
    const pool = await connectToDatabase();

    // Obtener la consulta actual desde la base de datos
    const consultaActual = await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .query(`
        SELECT clavestatus, fechaconsulta, clavenomina, nombrepaciente, departamento, edad
        FROM consultas
        WHERE claveconsulta = @claveconsulta
      `);

    if (consultaActual.recordset.length === 0) {
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    const estadoActual = consultaActual.recordset[0];

    // Evitar actualizaciones inválidas
    if (estadoActual.clavestatus === 2 && clavestatus === 0) {
      return res.status(400).json({
        message: "No se puede cambiar de atendida a cancelada.",
      });
    }

    // Actualizar el clavestatus en la base de datos
    await pool
      .request()
      .input("claveconsulta", sql.Int, claveConsulta)
      .input("clavestatus", sql.Int, clavestatus)
      .query(`
        UPDATE consultas
        SET clavestatus = @clavestatus
        WHERE claveconsulta = @claveconsulta
      `);

    // Construir el payload para Pusher
    const payload = {
      claveConsulta,
      clavestatus,
      fechaconsulta: estadoActual.fechaconsulta,
      clavenomina: estadoActual.clavenomina,
      nombrepaciente: estadoActual.nombrepaciente,
      departamento: estadoActual.departamento || "No asignado",
      edad: estadoActual.edad || "Desconocida",
    };

    const pusherUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/pusher`;

    // Enviar el evento a Pusher
    await axios.post(pusherUrl, {
      channel: "consultas",
      event: "estatus-actualizado",
      data: payload,
    });

    res.status(200).json({ message: "Estado actualizado y evento enviado." });
  } catch (error) {
    console.error("[ERROR] Error general:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  } finally {
    activeRequests.delete(requestKey);
  }
}
