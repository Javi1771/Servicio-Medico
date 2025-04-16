import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana incluido
function formatFecha(fecha) {
  const date = new Date(fecha);

  //* Días de la semana en español
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  //* Obtener los valores en UTC para preservar la hora exacta de la base de datos
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

  try {
    const { claveconsulta } = req.query;
    if (!claveconsulta) {
      return res.status(400).json({ message: "La claveconsulta es requerida." });
    }

    const pool = await connectToDatabase();
    
    //console.log("🔍 Obteniendo registros de incapacidades para claveconsulta:", claveconsulta);

    const result = await pool
      .request()
      .input("claveconsulta", claveconsulta)
      .query(`
        SELECT 
          i.[claveincapacidad],
          i.[folioincapacidad],
          i.[fecha],
          i.[fechainicio],
          i.[fechafin],
          i.[nomina],
          i.[nombrepaciente],
          i.[departamento],
          i.[observaciones],
          i.[edad],
          i.[quiencapturo],
          i.[claveconsulta],
          p.[nombreproveedor]
        FROM incapacidades i
        LEFT JOIN proveedores p 
          ON i.[claveMedico] = p.[claveproveedor]
        WHERE i.[claveconsulta] = @claveconsulta
      `);

    if (result.recordset.length === 0) {
      //console.log("⚠️ No se encontraron registros de incapacidades para la claveconsulta:", claveconsulta);
      return res.status(404).json({ message: "No se encontraron registros de incapacidades." });
    }

    //* Si se encontró al menos un registro, extraemos el nombre del usuario y lo enviamos como cookie
    const usuario = result.recordset[0];
    res.setHeader(
      "Set-Cookie",
      `nombreusuario=${encodeURIComponent(usuario.nombreproveedor)}; path=/; samesite=lax`
    );

    //* Mapear los registros formateando las fechas y calculando la diferencia en días
    const dataFormateada = result.recordset.map((registro) => {
      const inicio = new Date(registro.fechainicio);
      const fin = new Date(registro.fechafin);
      //* Calcular la diferencia en milisegundos y convertirla a días
      const diffDays = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
      
      return {
        ...registro,
        fecha: formatFecha(registro.fecha),
        fechainicio: formatFecha(registro.fechainicio),
        fechafin: formatFecha(registro.fechafin),
        dias: diffDays,
      };
    });

    //console.log("✅ Registros obtenidos:", dataFormateada.length);
    //console.log("📦 Datos enviados al front:", JSON.stringify(dataFormateada, null, 2));

    return res.status(200).json(dataFormateada);
  } catch (error) {
    console.error("❌ Error al obtener los datos:", error);
    return res.status(500).json({ message: "Error al obtener los datos de incapacidades", error: error.message });
  }
}
