import { connectToDatabase } from "../../api/connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    folioPase,
    fechaEmision,
    nomina,
    clavePaciente,
    nombrePaciente,
    edad,
    esEmpleado,
    claveMedico,
    diagnostico,
    departamento,
    estatus,
    costo,
    fechaDespacho,
    sindicato,
    claveUsuario,
  } = req.body;

  // Verificar si los datos obligatorios están presentes
  if (
    !folioPase ||
    !nomina ||
    !clavePaciente ||
    !nombrePaciente ||
    !claveMedico ||
    !diagnostico ||
    !costo
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios en la solicitud." });
  }

  try {
    // Conectar a la base de datos
    const pool = await connectToDatabase();

    // Realizar la consulta para insertar los datos
    const result = await pool.request()
      .input("folioPase", sql.Int, folioPase)
      .input("fechaEmision", sql.DateTime, fechaEmision || new Date())
      .input("nomina", sql.Int, nomina)
      .input("clavePaciente", sql.Int, clavePaciente)
      .input("nombrePaciente", sql.NVarChar, nombrePaciente)
      .input("edad", sql.NVarChar, edad || null)
      .input("esEmpleado", sql.NVarChar, esEmpleado || "N")
      .input("claveMedico", sql.Int, claveMedico)
      .input("diagnostico", sql.NVarChar, diagnostico)
      .input("departamento", sql.NVarChar, departamento || null)
      .input("estatus", sql.Int, estatus || 1)
      .input("costo", sql.Decimal(18, 2), costo)
      .input("fechaDespacho", sql.DateTime, fechaDespacho || new Date())
      .input("sindicato", sql.NVarChar, sindicato || null)
      .input("claveUsuario", sql.Int, claveUsuario || null)
      .query(`
        INSERT INTO SURTIMIENTOS (
          FOLIO_PASE,
          FECHA_EMISION,
          NOMINA,
          CLAVE_PACIENTE,
          NOMBRE_PACIENTE,
          EDAD,
          ESEMPLEADO,
          CLAVEMEDICO,
          DIAGNOSTICO,
          DEPARTAMENTO,
          ESTATUS,
          COSTO,
          FECHA_DESPACHO,
          SINDICATO,
          claveusuario
        )
        VALUES (
          @folioPase, @fechaEmision, @nomina, @clavePaciente,
          @nombrePaciente, @edad, @esEmpleado, @claveMedico,
          @diagnostico, @departamento, @estatus, @costo,
          @fechaDespacho, @sindicato, @claveUsuario
        )
      `);

    // Respuesta si la consulta fue exitosa
    res.status(201).json({
      message: "Consulta creada exitosamente.",
      data: result,
    });
  } catch (error) {
    console.error("Error al crear la consulta:", error.message);
    res.status(500).json({
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
}
