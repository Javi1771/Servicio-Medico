import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  //* Desestructuramos lo que llega en req.body
  const {
    id_enf_cronica,
    clavenomina,
    clavepaciente,
    valor_actual,
    valor_objetivo,
    calificacion,
    valor_alcanzado,
    id_kpi,
  } = req.body;

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

  //* Antes de hacer el insert, si la calificacion no viene, la ponemos como "SIN CALIFICAR"
  const finalCalificacion = calificacion || "SIN CALIFICAR";

  //* Registro detallado de cada campo
  console.log("Datos individuales recibidos en el servidor:");
  console.log("id_kpi:", id_kpi);
  console.log("id_enf_cronica:", id_enf_cronica);
  console.log("clavenomina:", clavenomina);
  console.log("clavepaciente:", clavepaciente);
  console.log("valor_actual:", valor_actual);
  console.log("valor_objetivo:", valor_objetivo);
  console.log("calificacion:", finalCalificacion);
  console.log("valor_alcanzado:", valor_alcanzado);

  //? 3) Verificar datos obligatorios
  if (
    !id_enf_cronica ||
    !clavenomina ||
    !clavepaciente ||
    valor_actual === undefined ||
    valor_objetivo === undefined
  ) {
    console.error("Error: Faltan datos obligatorios", {
      id_enf_cronica,
      clavenomina,
      clavepaciente,
      valor_actual,
      valor_objetivo,
      id_kpi,
    });
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const pool = await connectToDatabase();

    //? 4) Incluir la columna calificacion y clave_registro en el INSERT
    const query = `
      INSERT INTO REGISTROS_KPIS (
        id_kpi,
        clavenomina,
        valor_actual,
        valor_objetivo,
        fecha_registro,
        id_enf_cronica,
        clavepaciente,
        clave_registro,
        calificacion
      )
      VALUES (
        @id_kpi,
        @clavenomina,
        @valor_actual,
        @valor_objetivo,
        GETDATE(),
        @id_enf_cronica,
        @clavepaciente,
        @clave_registro,
        @calificacion
      )
    `;

    await pool
      .request()
      .input("id_kpi", id_kpi)
      .input("id_enf_cronica", id_enf_cronica)
      .input("clavenomina", clavenomina)
      .input("clavepaciente", clavepaciente)
      .input("valor_actual", valor_actual)
      .input("valor_objetivo", valor_objetivo)
      .input("clave_registro", claveusuario)
      .input("calificacion", finalCalificacion)
      .query(query);

    res.status(201).json({ message: "KPI registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar KPI en la base de datos:", error);
    res.status(500).json({ message: "Error al registrar KPI", error });
  }
}
