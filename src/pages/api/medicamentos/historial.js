import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

//* Función para formatear la fecha con día de la semana
function formatFecha(fecha) {
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { clavenomina, clavepaciente } = req.query;

  if (!clavenomina || !clavepaciente) {
    return res.status(400).json({
      message: "Falta el parámetro obligatorio: clavenomina y/o clavepaciente",
    });
  }

  try {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("clavenomina", sql.NVarChar, clavenomina)
      .input("clavepaciente", sql.NVarChar, clavepaciente)
      .query(`
        SELECT 
          s.FECHA_EMISION,
          s.CLAVEMEDICO,
          p.nombreproveedor,
          d.indicaciones,
          d.cantidad,
          d.piezas,
          m.medicamento
        FROM SURTIMIENTOS s
        JOIN detalleSurtimientos d ON s.FOLIO_SURTIMIENTO = d.folioSurtimiento
        JOIN MEDICAMENTOS m ON d.claveMedicamento = m.clavemedicamento
        JOIN PROVEEDORES p ON s.CLAVEMEDICO = p.claveproveedor
        WHERE s.NOMINA = @clavenomina
          AND s.CLAVE_PACIENTE = @clavepaciente
          AND d.estatus = 2
        ORDER BY s.FECHA_EMISION DESC
      `);

    const historial = result.recordset.map((item) => ({
      medicamento: item.medicamento,
      indicaciones: item.indicaciones,
      tratamiento: item.cantidad, 
      piezas: item.piezas,
      nombreproveedor: item.nombreproveedor,
      fechaEmision: formatFecha(item.FECHA_EMISION),
    }));

    //console.log("Historial:", historial);
    return res.status(200).json({ ok: true, historial });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({
      message: "Error al obtener historial",
      error: error.message,
    });
  }
}
