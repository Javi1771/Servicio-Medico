import sql from "mssql";
import { connectToDatabase } from "../connectToDatabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido." });
  }

  try {
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
    const surtimientoResult = await pool
      .request()
      .input("folio", sql.VarChar, folio)
      .query(surtimientoQuery);

    if (!surtimientoResult.recordset.length) {
      return res.status(404).json({
        message: "No se encontró surtimiento para el folio proporcionado.",
      });
    }

    //* Tomar los datos generales del surtimiento de la primera fila
    const surtimiento = surtimientoResult.recordset[0];

    //* Obtener todos los medicamentos asociados al surtimiento
    const medicamentos = surtimientoResult.recordset
      .filter((row) => row.claveMedicamento) //* Solo filas que tengan medicamento
      .map((row) => ({
        claveMedicamento: row.claveMedicamento,
        medicamento: row.medicamento,
      }));

    //* Buscar nombre del proveedor usando CLAVEMEDICO
    const proveedorQuery = `
      SELECT nombreproveedor 
      FROM PROVEEDORES 
      WHERE claveproveedor = @claveMedico
    `;
    const proveedorResult = await pool
      .request()
      .input("claveMedico", sql.Int, surtimiento.CLAVEMEDICO)
      .query(proveedorQuery);

    const nombreproveedor = proveedorResult.recordset.length
      ? proveedorResult.recordset[0].nombreproveedor
      : null;

    //* Retornar toda la información completa
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
        medicamentos, //* Aquí envías la lista de medicamentos
      },
    });
  } catch (error) {
    console.error("Error al buscar surtimiento:", error);
    return res.status(500).json({
      message: "Error al buscar el surtimiento",
      error: error.message,
    });
  }
}
