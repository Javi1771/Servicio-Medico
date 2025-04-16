import { connectToDatabase } from "../connectToDatabase";

//* Función para formatear la fecha con día de la semana en español
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
  const diaSemana = diasSemana[date.getDay()];
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const año = date.getFullYear();
  const horas = date.getHours();
  const minutos = String(date.getMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

//* Función para obtener fecha del servidor en formato YYYY-MM-DD HH:mm:ss.sss
function obtenerFechaServidor() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const segundos = String(ahora.getSeconds()).padStart(2, "0");
  const milisegundos = String(ahora.getMilliseconds()).padStart(3, "0");

  return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}.${milisegundos}`;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const pool = await connectToDatabase();
      //console.log("Conexión a la base de datos exitosa");

      const result = await pool.request().query(`
        SELECT 
          m.claveMedicamento AS id,
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(m.medicamento, ', ', ','), 
                ',', ', '
              ),
              ' / ', '/'
            ),
            '/', ' / '
          ) AS medicamento,
          m.clasificacion,
          m.presentacion,
          m.ean,
          m.piezas,
          m.maximo,
          m.minimo,
          u.medida,
          CASE 
            WHEN m.piezas <= m.minimo THEN 'stock bajo'
            WHEN m.piezas >= m.maximo THEN 'stock alto'
            ELSE 'stock medio'
          END AS stockStatus
        FROM MEDICAMENTOS m
        INNER JOIN unidades_de_medida u ON m.medida = u.id_medida
        WHERE m.estatus = 1 
          AND m.piezas < m.maximo
        ORDER BY stockStatus ASC
      `);

      const medicamentos = result.recordset;
      const nombreusuario = decodeURIComponent(req.cookies.nombreusuario);

      const fechaServidor = obtenerFechaServidor();
      //console.log("Fecha del servidor obtenida:", fechaServidor);

      const fechaActualFormateada = formatFecha(fechaServidor);

      //console.log("Cookie obtenida:", nombreusuario);
      //console.log("Medicamentos enviados:", medicamentos);
      //console.log("Fecha enviada:", fechaActualFormateada);

      res.status(200).json({
        usuario: nombreusuario,
        fecha: fechaActualFormateada,
        medicamentos,
      });
    } catch (error) {
      console.error("Error al obtener los medicamentos:", error);
      res.status(500).json({ message: "Error al obtener los medicamentos" });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
