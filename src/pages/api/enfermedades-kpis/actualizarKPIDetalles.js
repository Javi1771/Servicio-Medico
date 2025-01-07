import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  //? 1) Obtener la cookie 'claveusuario' de forma manual
  const rawCookies = req.headers.cookie || "";
  //* Buscamos la cookie "claveusuario" en la cadena
  const claveusuarioCookie = rawCookies
    .split("; ")
    .find((row) => row.startsWith("claveusuario="))
    ?.split("=")[1];

  //* Guardamos el valor en claveusuario (o null si no existe)
  const claveusuario = claveusuarioCookie || null;

  console.log("Cookie claveusuario:", claveusuario);

  //? 2) Revisar que tengamos claveusuario
  if (!claveusuario) {
    return res
      .status(400)
      .json({ message: "No se encontró la cookie 'claveusuario'" });
  }

  //* Desestructuramos los datos del body
  const {
    id_registro_kpi,
    valor_alcanzado,
    calificacion,
    observaciones,
    fecha_evaluacion,
  } = req.body;

  //* Log para verificar los datos recibidos en el backend
  console.log("Datos recibidos en el backend:", {
    id_registro_kpi,
    valor_alcanzado,
    calificacion,
    observaciones,
    fecha_evaluacion,
  });

  //* Validar datos requeridos
  if (
    !id_registro_kpi ||
    valor_alcanzado === undefined ||
    calificacion === undefined ||
    !fecha_evaluacion
  ) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
      datos_recibidos: {
        id_registro_kpi,
        valor_alcanzado,
        calificacion,
        observaciones,
        fecha_evaluacion,
      },
    });
  }

  try {
    const pool = await connectToDatabase();

    //? 3) Incluir la columna clave_evaluo en la sentencia UPDATE
    const query = `
      UPDATE REGISTROS_KPIS
      SET valor_alcanzado = @valor_alcanzado,
          calificacion = @calificacion,
          observaciones = @observaciones,
          fecha_evaluacion = @fecha_evaluacion,
          clave_evaluo = @clave_evaluo
      WHERE id_registro_kpi = @id_registro_kpi
    `;

    console.log("Ejecutando consulta SQL con datos:");
    console.log({
      id_registro_kpi,
      valor_alcanzado,
      calificacion,
      observaciones,
      fecha_evaluacion,
      claveusuario, 
    });

    //? 4) Pasamos la nueva input "clave_evaluo" con el valor de la cookie
    const result = await pool
      .request()
      .input("valor_alcanzado", valor_alcanzado)
      .input("calificacion", calificacion)
      .input("observaciones", observaciones)
      .input("fecha_evaluacion", fecha_evaluacion)
      .input("clave_evaluo", claveusuario)
      .input("id_registro_kpi", id_registro_kpi)
      .query(query);

    //* Validar si se actualizó algún registro
    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró el KPI especificado." });
    }

    res.status(200).json({ message: "KPI actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar KPI:", error);
    res.status(500).json({ message: "Error interno del servidor.", error });
  }
}
