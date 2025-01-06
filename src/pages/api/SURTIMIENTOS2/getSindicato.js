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
    // Conectar a la base de datos y obtener clave nómina
    const pool = await connectToDatabase();
    console.log("Conectado a la base de datos. Buscando clave nómina...");

    const result = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(`
        SELECT clavenomina
        FROM [PRESIDENCIA].[dbo].[consultas]
        WHERE claveconsulta = @folio
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró la clave nómina para el folio proporcionado." });
    }

    const clavenomina = result.recordset[0].clavenomina;
    console.log("Clave nómina encontrada:", clavenomina);

    // Consultar en el servicio SOAP
    const client = await createClientAsync(soapUrl);
    console.log("Cliente SOAP creado exitosamente.");

    const empObject = { emp: { num_nom: clavenomina } };
    const [resultSOAP] = await client.GetEmpleadoAsync(empObject);

    if (!resultSOAP || !resultSOAP.GetEmpleadoResult) {
      return res.status(404).json({ message: "No se encontraron datos en el servicio SOAP." });
    }

    const empleado = resultSOAP.GetEmpleadoResult;

    // Extraer grupoNomina y cuotaSindical
    const { grupoNomina, cuotaSindical } = empleado;

    return res.status(200).json({ grupoNomina, cuotaSindical });
  } catch (error) {
    console.error("Error al obtener datos del sindicato:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
