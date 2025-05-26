import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export const config = {
  api: {
    bodyParser: true, 
  },
};

export default async function handler(req, res) {
  //? 0️⃣ Forzar siempre JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //? 1️⃣ Sólo POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido. Usa POST." });
  }

  //? 2️⃣ Body válido JSON
  let body;
  try {
    body = req.body;
  } catch {
    return res
      .status(400)
      .json({ success: false, message: "Body JSON inválido." });
  }

  //? 3️⃣ Parámetro folio
  const { folio } = body;
  if (!folio) {
    return res
      .status(400)
      .json({ success: false, message: "Folio es requerido." });
  }

  try {
    //? 4️⃣ Conectar BD y ejecutar query principal
    const pool = await connectToDatabase();

    const surtimientoQuery = `
      SELECT 
        S.NOMINA,
        S.NOMBRE_PACIENTE,
        S.EDAD,
        S.DEPARTAMENTO,
        S.DIAGNOSTICO,
        S.CLAVEMEDICO,
        S.FOLIO_SURTIMIENTO,
        DS.claveMedicamento,
        M.medicamento
      FROM SURTIMIENTOS S
      LEFT JOIN detalleSurtimientos DS ON S.FOLIO_SURTIMIENTO = DS.folioSurtimiento
      LEFT JOIN MEDICAMENTOS M ON DS.claveMedicamento = M.clavemedicamento
      WHERE S.FOLIO_PASE = @folio
        AND S.ESTATUS = 1;
    `;

    const result = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(surtimientoQuery);

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: "No se encontró surtimiento para el folio proporcionado.",
      });
    }

    //? 5️⃣ Armado de datos
    const surtimiento = result.recordset[0];
    const medicamentos = result.recordset
      .filter((r) => r.claveMedicamento)
      .map((r) => ({
        claveMedicamento: r.claveMedicamento,
        medicamento: r.medicamento,
      }));

    //? 6️⃣ Nombre del proveedor
    const proveedorQuery = `
      SELECT nombreproveedor
      FROM PROVEEDORES
      WHERE claveproveedor = @claveMedico;
    `;
    const provRes = await pool
      .request()
      .input("claveMedico", sql.Int, surtimiento.CLAVEMEDICO)
      .query(proveedorQuery);

    const nombreproveedor = provRes.recordset[0]?.nombreproveedor || null;

    //? 7️⃣ Respuesta OK
    return res.status(200).json({
      success: true,
      data: {
        nomina: surtimiento.NOMINA,
        nombrePaciente: surtimiento.NOMBRE_PACIENTE,
        edad: surtimiento.EDAD,
        departamento: surtimiento.DEPARTAMENTO,
        diagnostico: surtimiento.DIAGNOSTICO,
        clavemedico: surtimiento.CLAVEMEDICO,
        folio_surtimiento: surtimiento.FOLIO_SURTIMIENTO,
        nombreproveedor,
        medicamentos,
      },
    });
  } catch (error) {
    console.error("💥 Error inesperado en buscarSurtimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al buscar el surtimiento",
      error: error.message,
    });
  }
}
