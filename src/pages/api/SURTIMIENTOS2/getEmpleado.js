import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import { createClientAsync } from "soap";

const soapUrl = "http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.body;

  if (!folio) {
    return res.status(400).json({ message: "El folio es requerido." });
  }

  try {
    const pool = await connectToDatabase();
    //console.log("Conectado a la base de datos. Buscando clave nómina...");

    const result = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(`
        SELECT clavenomina
        FROM consultas
        WHERE claveconsulta = @folio
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró la clave nómina para el folio proporcionado." });
    }

    const clavenomina = result.recordset[0].clavenomina;
    //console.log("Clave nómina encontrada:", clavenomina);

    const client = await createClientAsync(soapUrl);
    const empObject = { emp: { num_nom: clavenomina } };
    const [resultSOAP] = await client.GetEmpleadoAsync(empObject);

    if (!resultSOAP || !resultSOAP.GetEmpleadoResult) {
      return res.status(404).json({ message: "No se encontraron datos del empleado en el servicio SOAP." });
    }

    const empleado = resultSOAP.GetEmpleadoResult;
    const nombreCompleto = `${empleado.nombre} ${empleado.a_paterno} ${empleado.a_materno}`.trim();

    //console.log("Empleado encontrado:", { nombreCompleto, clavenomina });

    res.status(200).json({ nombreCompleto, clavenomina });
  } catch (error) {
    console.error("Error al obtener datos del empleado:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}
