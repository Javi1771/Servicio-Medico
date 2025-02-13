import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio, medicamentos, diagnostico } = req.body;

  // Validación de datos recibidos
  if (
    !folio ||
    !Array.isArray(medicamentos) ||
    medicamentos.length === 0 ||
    !diagnostico
  ) {
    console.error("Datos incompletos recibidos:", {
      folio,
      medicamentos,
      diagnostico,
    });
    return res
      .status(400)
      .json({ message: "Folio, medicamentos y diagnóstico son requeridos." });
  }

  try {
    const pool = await connectToDatabase();

    // Obtener el último FOLIO_SURTIMIENTO
    const folioQuery = `
      SELECT ISNULL(MAX(FOLIO_SURTIMIENTO), 0) + 1 AS nuevoFolio
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
    `;
    const folioResult = await pool.request().query(folioQuery);
    const nuevoFolio = folioResult.recordset[0].nuevoFolio;
    console.log("Nuevo folio generado:", nuevoFolio);

    // Obtener los datos del folio de consulta
    const consultaQuery = `
      SELECT clavenomina, sindicato, clavepaciente, nombrepaciente, edad, elpacienteesempleado,
             claveproveedor, departamento, clavestatus, claveusuario
      FROM [PRESIDENCIA].[dbo].[consultas]
      WHERE claveconsulta = @folio
    `;
    const consultaResult = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(consultaQuery);

    if (consultaResult.recordset.length === 0) {
      console.error("No se encontró información para el folio:", folio);
      return res
        .status(404)
        .json({ message: "No se encontró información del folio." });
    }

    const consulta = consultaResult.recordset[0];
    console.log("Datos de la consulta encontrados:", consulta);

    //? Determinar el sindicato con base en clavenomina
    //* getSindicato recibe la "claveconsulta" (folioReceta)
    //* y realiza una petición a tu API para traer el sindicato.
    const getSindicato = async (folioReceta) => {
      try {
        //* Petición POST a tu endpoint que devuelva la info de la columna "sindicato"
        const response = await fetch("/api/SURTIMIENTOS2/getsindicato", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ claveconsulta: folioReceta }),
        });

        //* Si la respuesta no es OK, arrojamos un error para manejarlo en el catch
        if (!response.ok) {
          throw new Error("Error al obtener el sindicato");
        }

        //* Parseamos la respuesta (JSON)
        const data = await response.json();

        //* data.sindicato contendrá el valor en la columna "sindicato"
        //! Si viene null o undefined, retornamos "No está sindicalizado"
        return data.sindicato ?? "No está sindicalizado";
      } catch (error) {
        console.error("Error en getSindicato:", error);
        //! Retornar un string fijo o null para indicar error
        return null;
      }
    };

    const sindicato = await getSindicato(consulta.clavenomina);
    console.log("Sindicato determinado:", sindicato);

    // Normalizar el valor del campo departamento
    let departamento = consulta.departamento || null;
    if (departamento && departamento.length > 100) {
      departamento = departamento.substring(0, 100);
    }
    console.log(
      "Longitud del valor del campo departamento después de normalizar:",
      departamento ? departamento.length : 0
    );

    // Insertar en la tabla SURTIMIENTOS
    const insertSurtimientoQuery = `
      INSERT INTO [PRESIDENCIA].[dbo].[SURTIMIENTOS] (
        FOLIO_SURTIMIENTO, FOLIO_PASE, FECHA_EMISION, NOMINA, CLAVE_PACIENTE,
        NOMBRE_PACIENTE, EDAD, ESEMPLEADO, CLAVEMEDICO, DIAGNOSTICO,
        DEPARTAMENTO, ESTATUS, COSTO, FECHA_DESPACHO, SINDICATO, claveusuario
      ) VALUES (
        @nuevoFolio, @folioPase, GETDATE(), @nomina, @clavePaciente,
        @nombrePaciente, @edad, @esEmpleado, @claveMedico, @diagnostico,
        @departamento, @estatus, NULL, NULL, @sindicato, @claveUsuario
      )
    `;
    await pool
      .request()
      .input("nuevoFolio", sql.Int, nuevoFolio)
      .input("folioPase", sql.Int, folio)
      .input("nomina", sql.NVarChar(15), consulta.clavenomina || null)
      .input("clavePaciente", sql.NVarChar(15), consulta.clavepaciente)
      .input("nombrePaciente", sql.NVarChar(50), consulta.nombrepaciente)
      .input("edad", sql.NVarChar(50), String(consulta.edad || "0"))
      .input("esEmpleado", sql.NVarChar(1), consulta.elpacienteesempleado)
      .input("claveMedico", sql.Int, consulta.claveproveedor)
      .input("diagnostico", sql.NVarChar(sql.MAX), diagnostico)
      .input("departamento", sql.NVarChar(100), departamento)
      .input("estatus", sql.Bit, consulta.clavestatus)
      .input("sindicato", sql.NVarChar(10), sindicato || null)
      .input("claveUsuario", sql.Int, consulta.claveusuario)
      .query(insertSurtimientoQuery);

    console.log("Surtimiento insertado exitosamente.");

    // Insertar medicamentos en la tabla detalleSurtimientos
    const insertDetalleQuery = `
      INSERT INTO [PRESIDENCIA].[dbo].[detalleSurtimientos] (
        folioSurtimiento, claveMedicamento, indicaciones, cantidad, estatus
      ) VALUES (
        @folioSurtimiento, @claveMedicamento, @indicaciones, @cantidad, 1
      )
    `;

    for (const medicamento of medicamentos) {
      if (!medicamento.claveMedicamento) {
        console.error(
          "claveMedicamento es null o vacío para el medicamento:",
          medicamento
        );
        continue; // Salta este medicamento si la clave es inválida
      }

      await pool
        .request()
        .input("folioSurtimiento", sql.Int, nuevoFolio)
        .input(
          "claveMedicamento",
          sql.NVarChar(12),
          medicamento.claveMedicamento
        )
        .input("indicaciones", sql.NVarChar(sql.MAX), medicamento.indicaciones)
        .input("cantidad", sql.NVarChar(70), medicamento.cantidad)
        .query(insertDetalleQuery);
    }

    console.log("Todos los medicamentos insertados exitosamente.");

    // Actualizar el diagnóstico en la tabla consultas
    const updateConsultaQuery = `
      UPDATE [PRESIDENCIA].[dbo].[consultas]
      SET diagnostico = @diagnostico
      WHERE claveconsulta = @folio
    `;
    await pool
      .request()
      .input("diagnostico", sql.NVarChar(sql.MAX), diagnostico)
      .input("folio", sql.Int, folio)
      .query(updateConsultaQuery);

    console.log("Diagnóstico actualizado exitosamente.");

    res.status(200).json({ message: "Receta guardada exitosamente." });
  } catch (error) {
    console.error("Error al guardar la receta:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}
