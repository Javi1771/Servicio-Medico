import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  //* Forzar siempre JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    //? 1) Método válido
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ message: "Método no permitido. Usa POST." });
    }

    //? 2) Body válido
    const { folio } = req.body;
    if (!folio) {
      return res
        .status(400)
        .json({ message: "Folio es requerido." });
    }

    //? 3) Conectar BD y obtener surtimiento
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
        AND S.ESTATUS = 1;`;

    const surtimientoResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(surtimientoQuery);

    if (!surtimientoResult.recordset.length) {
      return res.status(404).json({
        message: "No se encontró surtimiento para el folio proporcionado.",
      });
    }

    //? 4) Datos generales del surtimiento
    const surtimiento = surtimientoResult.recordset[0];
    const medicamentos = surtimientoResult.recordset
      .filter(row => row.claveMedicamento)
      .map(row => ({
        claveMedicamento: row.claveMedicamento,
        medicamento: row.medicamento,
      }));

    //? 5) Nombre del proveedor
    const proveedorQuery = `
      SELECT nombreproveedor 
      FROM PROVEEDORES 
      WHERE claveproveedor = @claveMedico`;
    const proveedorResult = await pool
      .request()
      .input("claveMedico", sql.Int, surtimiento.CLAVEMEDICO)
      .query(proveedorQuery);

    const nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    //? 6) Respuesta OK
    return res.status(200).json({
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
    //? 7) Cualquier excepción imprevista retorna JSON
    console.error("💥 Error inesperado en buscarSurtimiento:", error);
    return res.status(500).json({
      message: "Error al buscar el surtimiento",
      error:   error.message,
    });
  }
}
