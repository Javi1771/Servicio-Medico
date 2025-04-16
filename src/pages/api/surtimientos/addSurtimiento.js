import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

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
    esEmpleado,
    edad,
    claveMedico,
    diagnostico,
    departamento,
    estatus,
    fechaDespacho,
    sindicato,
    claveUsuario
  } = req.body;

  try {
    const pool = await connectToDatabase();

    // Obtener el último valor de FOLIO_SURTIMIENTO y sumar 1
    const folioQuery = `
      SELECT ISNULL(MAX(FOLIO_SURTIMIENTO), 0) + 1 AS nuevoFolio
      FROM SURTIMIENTOS
    `;
    const folioResult = await pool.request().query(folioQuery);
    const nuevoFolio = folioResult.recordset[0].nuevoFolio;

    // Depurar los datos que se están enviando
    // console.log("Datos que se están enviando a la tabla SURTIMIENTOS:");
    // console.log({
    //   nuevoFolio,
    //   folioPase,
    //   fechaEmision,
    //   nomina,
    //   clavePaciente,
    //   nombrePaciente,
    //   esEmpleado,
    //   edad,
    //   claveMedico,
    //   diagnostico,
    //   departamento,
    //   estatus,
    //   fechaDespacho,
    //   sindicato,
    //   claveUsuario
    // });

    // Depurar la longitud del campo departamento
    //console.log("Longitud del campo departamento:", departamento.length);

    const query = `
      INSERT INTO SURTIMIENTOS
        ([FOLIO_SURTIMIENTO]
        ,[FOLIO_PASE]
        ,[FECHA_EMISION]
        ,[NOMINA]
        ,[CLAVE_PACIENTE]
        ,[NOMBRE_PACIENTE]
        ,[ESEMPLEADO]
        ,[EDAD]
        ,[CLAVEMEDICO]
        ,[DIAGNOSTICO]
        ,[DEPARTAMENTO]
        ,[ESTADO]
        ,[FECHA_DESPACHO]
        ,[SINDICATO]
        ,[claveusuario]
        ,[ESTATUS])
      VALUES
        (@nuevoFolio
        ,@folioPase
        ,@fechaEmision
        ,@nomina
        ,@clavePaciente
        ,@nombrePaciente
        ,@esEmpleado
        ,@edad
        ,@claveMedico
        ,@diagnostico
        ,@departamento
        ,@estatus
        ,@fechaDespacho
        ,@sindicato
        ,@claveUsuario
        ,@estado)
    `;

    await pool
      .request()
      .input("nuevoFolio", sql.Int, nuevoFolio)
      .input("folioPase", sql.Int, folioPase)
      .input("fechaEmision", sql.DateTime, fechaEmision)
      .input("nomina", sql.NVarChar(15), nomina)
      .input("clavePaciente", sql.NVarChar(15), clavePaciente)
      .input("nombrePaciente", sql.NVarChar(50), nombrePaciente)
      .input("esEmpleado", sql.NVarChar(1), esEmpleado)
      .input("edad", sql.NVarChar(50), String(edad)) // Asegúrate de que edad sea una cadena de texto
      .input("claveMedico", sql.Int, claveMedico)
      .input("diagnostico", sql.NVarChar(sql.MAX), diagnostico)
      .input("departamento", sql.NVarChar(100), departamento)
      .input("estatus", sql.Bit, estatus)
      .input("fechaDespacho", sql.DateTime, fechaDespacho)
      .input("sindicato", sql.NVarChar(10), sindicato)
      .input("claveUsuario", sql.Int, claveUsuario)
      .input("estado", sql.Bit, estatus)
      .query(query);

    res.status(200).json({ message: "Surtimiento insertado exitosamente.", nuevoFolio });
  } catch (error) {
    console.error("Error al insertar el surtimiento:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}