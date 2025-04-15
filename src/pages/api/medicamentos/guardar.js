import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";
import cookie from "cookie"; //* Para parsear las cookies

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("❌ Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log(
    "📨 Datos recibidos en el backend:",
    JSON.stringify(req.body, null, 2)
  );
  const { medicamentos = [], folioReceta, decisionTomada } = req.body;

  if (!folioReceta || decisionTomada === undefined) {
    console.error("❌ Faltan datos obligatorios en el payload.");
    return res.status(400).json({
      error: "El payload debe contener 'folioReceta' y 'decisionTomada'.",
    });
  }

  let transaction;
  let consultaData = null; //* Declaramos la variable de forma global en el endpoint

  try {
    console.log("🌐 Conectando a la base de datos...");
    const pool = await connectToDatabase();
    console.log("✅ Conexión establecida con éxito.");

    //* Iniciamos una transacción para todas las operaciones
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    console.log("🔄 Transacción iniciada.");

    //? 1. Inserción en detalleReceta
    const queryInsertarReceta = `
      INSERT INTO detalleReceta
      (folioReceta, descMedicamento, indicaciones, estatus, cantidad, piezas)
      VALUES (@folioReceta, @descMedicamento, @indicaciones, @estatus, @cantidad, @piezas)
    `;
    const resultados = [];

    if (decisionTomada === "no") {
      console.log(
        "⚠ Decisión tomada: NO. Insertando registro predeterminado en detalleReceta."
      );
      await transaction
        .request()
        .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
        .input("descMedicamento", sql.Int, 0)
        .input(
          "indicaciones",
          sql.NVarChar,
          "Sin indicaciones ya que no se asignaron medicamentos."
        )
        .input("estatus", sql.Int, 1)
        .input(
          "cantidad",
          sql.NVarChar,
          "Sin tiempo de toma estimado, sin medicamentos."
        )
        .input("piezas", sql.Int, 0)
        .query(queryInsertarReceta);

      resultados.push({
        folioReceta,
        status: "success",
        message: "Registro predeterminado insertado en detalleReceta.",
      });
    } else {
      console.log(
        `💊 Insertando ${medicamentos.length} medicamento(s) en detalleReceta...`
      );
      for (const med of medicamentos) {
        console.log("📦 Medicamento a insertar:", med);
        //* Extraemos los campos enviados desde el front.
        //* Se recibe el valor del medicamento en "descMedicamento".
        //* El tratamiento (mensaje) puede venir en la propiedad "tratamiento" o en "cantidad".
        const { descMedicamento, indicaciones, tratamiento, cantidad, piezas } = med;
        //! Si tratamiento no existe, usamos lo que venga en cantidad.
        const treatmentValue = tratamiento || cantidad;
        if (!descMedicamento || !indicaciones || !treatmentValue || !piezas) {
          console.error("❌ Error: Medicamento con campos faltantes:", med);
          await transaction.rollback();
          return res.status(400).json({
            message: "Error: Medicamento tiene campos faltantes.",
          });
        }
        await transaction
          .request()
          .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
          //* Convertir descMedicamento al número esperado
          .input("descMedicamento", sql.Int, parseInt(descMedicamento, 10))
          .input("indicaciones", sql.NVarChar, indicaciones.trim())
          .input("estatus", sql.Int, 1)
          //* Usamos treatmentValue para la columna "cantidad"
          .input("cantidad", sql.NVarChar, treatmentValue.trim())
          .input("piezas", sql.Int, parseInt(piezas, 10))
          .query(queryInsertarReceta);
        resultados.push({
          medicamento: med,
          status: "success",
        });
      }
    }
    console.log("✅ Inserción en detalleReceta completada.");

    //! Sólo si se asignaron medicamentos, se realizan las operaciones siguientes:
    if (decisionTomada !== "no") {
      //? 2. Consulta en la tabla "consultas"
      console.log(`🔎 Buscando consulta con folioReceta: ${folioReceta}...`);
      const consultaQuery = `
        SELECT 
          clavepaciente, nombrepaciente, claveproveedor, motivoconsulta, 
          diagnostico, claveusuario, clavenomina, elpacienteesempleado, 
          departamento, edad, sindicato, fechaconsulta
        FROM consultas
        WHERE claveconsulta = @folioReceta
      `;
      const consultaResult = await transaction
        .request()
        .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
        .query(consultaQuery);

      consultaData = consultaResult.recordset[0] || null;
      if (!consultaData) {
        console.error("❌ No se encontró consulta con la clave proporcionada.");
        await transaction.rollback();
        return res
          .status(404)
          .json({ error: "No se encontró consulta asociada al folioReceta." });
      }
      console.log(
        "✅ Consulta encontrada:",
        JSON.stringify(consultaData, null, 2)
      );

      //? 3. Calcular el nuevo FOLIO_SURTIMIENTO
      const queryNuevoFolio = `SELECT ISNULL(MAX(FOLIO_SURTIMIENTO), 0) + 1 AS newFolio FROM SURTIMIENTOS;`;
      const nuevoFolioResult = await transaction
        .request()
        .query(queryNuevoFolio);
      const newFolioSurtimiento = nuevoFolioResult.recordset[0].newFolio;
      console.log("✅ Nuevo FOLIO_SURTIMIENTO calculado:", newFolioSurtimiento);

      //? 4. Inserción en SURTIMIENTOS
      console.log("📦 Insertando en SURTIMIENTOS...");
      const queryInsertSurtimientos = `
        INSERT INTO SURTIMIENTOS (
          FOLIO_SURTIMIENTO, FOLIO_PASE,
          FECHA_EMISION, NOMINA,
          CLAVE_PACIENTE, NOMBRE_PACIENTE,
          EDAD, ESEMPLEADO, CLAVEMEDICO,
          DIAGNOSTICO, DEPARTAMENTO,
          ESTADO, SINDICATO, claveusuario, ESTATUS
        )
        VALUES (
          @folioSurtimiento, @folioPase,
          @fechaEmision, @nomina,
          @clavePaciente, @nombrePaciente,
          @edad, @epacienteEsEmpleado,
          @claveMedico, @diagnostico,
          @departamento, @estatus,
          @sindicato, @claveUsuario, @estado
        )
      `;
      await transaction
        .request()
        .input("folioSurtimiento", sql.Int, newFolioSurtimiento)
        .input("folioPase", sql.Int, parseInt(folioReceta, 10))
        .input("fechaEmision", sql.DateTime, consultaData.fechaconsulta)
        .input("nomina", sql.VarChar, consultaData.clavenomina)
        .input("clavePaciente", sql.VarChar, consultaData.clavepaciente)
        .input("nombrePaciente", sql.VarChar, consultaData.nombrepaciente)
        .input("edad", sql.VarChar, consultaData.edad)
        .input("epacienteEsEmpleado", sql.VarChar, consultaData.elpacienteesempleado)
        .input("claveMedico", sql.VarChar, String(consultaData.claveproveedor))
        .input("diagnostico", sql.NVarChar, consultaData.diagnostico)
        .input("departamento", sql.VarChar, consultaData.departamento)
        .input("estatus", sql.Int, 1)
        .input("sindicato", sql.VarChar, consultaData.sindicato)
        .input("claveUsuario", sql.VarChar, String(consultaData.claveusuario))
        .input("estado", sql.Int, 1)
        .query(queryInsertSurtimientos);
      console.log("✅ Inserción en SURTIMIENTOS completada.");

      //? 5. Inserción en detalleSurtimientos
      console.log("📦 Insertando en detalleSurtimientos...");
      const queryInsertDetalleSurtimientos = `
        INSERT INTO detalleSurtimientos (
          folioSurtimiento,
          claveMedicamento,
          indicaciones,
          cantidad,
          estatus,
          piezas,
          entregado
        )
        VALUES (
          @folioSurtimiento,
          @claveMedicamento,
          @indicaciones,
          @cantidad,
          @estatus,
          @piezas,
          @entregado
        )
      `;
      for (const med of medicamentos) {
        console.log("📝 Insertando detalleSurtimiento:", med);
        await transaction
          .request()
          .input("folioSurtimiento", sql.Int, newFolioSurtimiento)
          .input("claveMedicamento", sql.Int, parseInt(med.descMedicamento, 10))
          .input("indicaciones", sql.NVarChar, med.indicaciones.trim())
          .input("cantidad", sql.NVarChar, med.cantidad.trim())
          .input("estatus", sql.Int, 1)
          .input("piezas", sql.Int, parseInt(med.piezas, 10))
          .input("entregado", sql.Int, 0)
          .query(queryInsertDetalleSurtimientos);
      }
      console.log("✅ Inserción en detalleSurtimientos completada.");

      //? Registrar la actividad de asignación de medicamentos
      try {
        const allCookies = cookie.parse(req.headers.cookie || "");
        const idUsuario = allCookies.claveusuario;
        let ip =
          (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : null);

        if (idUsuario !== null) {
          await pool
            .request()
            .input("userId", sql.Int, idUsuario)
            .input("accion", sql.VarChar, "Asignó medicamentos")
            .input("direccionIP", sql.VarChar, ip)
            .input("agenteUsuario", sql.VarChar, req.headers["user-agent"] || "")
            .input("claveConsulta", sql.Int, folioReceta)
            .query(`
              INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
              VALUES (@userId, @accion, DATEADD(MINUTE, -4, GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
            `);
          console.log("Actividad de asignación de medicamentos registrada.");
        } else {
          console.log("Cookie 'claveusuario' no encontrada; actividad no registrada.");
        }
      } catch (errorRegistro) {
        console.error("Error registrando actividad de asignación:", errorRegistro);
      }
    } //! Fin de if (decisionTomada !== "no")

    //* Commit de la transacción: si todo se ejecutó sin errores, se confirman todos los cambios
    await transaction.commit();
    console.log("🎉 Transacción COMPLETA. Todos los datos guardados correctamente.");
    res.status(200).json({
      message: "Datos guardados correctamente.",
      resultados,
      consulta: consultaData, //! Será null si decisionTomada es "no"
      surtimientos:
        decisionTomada !== "no"
          ? "Registro en SURTIMIENTOS insertado."
          : "No se asignaron medicamentos, no se realizó registro en SURTIMIENTOS.",
      detalleSurtimientos:
        decisionTomada !== "no"
          ? "Registros en detalleSurtimientos insertados."
          : "No se asignaron medicamentos, no se realizó registro en detalleSurtimientos.",
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    if (transaction) {
      try {
        await transaction.rollback();
        console.log("🔄 Transacción revertida.");
      } catch (rollbackError) {
        console.error("❌ Error al hacer rollback:", rollbackError);
      }
    }
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
}
