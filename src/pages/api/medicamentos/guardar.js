import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("❌ Método no permitido. Solo se acepta POST.");
    return res.status(405).json({ error: "Método no permitido" });
  }

  //console.log("📨 Datos recibidos en el backend:", JSON.stringify(req.body, null, 2) );
  const { medicamentos = [], folioReceta, decisionTomada } = req.body;

  if (!folioReceta || decisionTomada === undefined) {
    console.error("❌ Faltan datos obligatorios en el payload.");
    return res.status(400).json({
      error: "El payload debe contener 'folioReceta' y 'decisionTomada'.",
    });
  }

  let transaction;
  let consultaData = null;
  const resultados = [];

  try {
    //console.log("🌐 Conectando a la base de datos...");
    const pool = await connectToDatabase();
    //console.log("✅ Conexión establecida con éxito.");

    //* Iniciamos transacción
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    //console.log("🔄 Transacción iniciada.");

    //? 1) Inserción en detalleReceta (con columnas seAsignoResurtimiento y cantidadMeses)
    const queryInsertarReceta = `
      INSERT INTO detalleReceta
        (folioReceta, descMedicamento, indicaciones, estatus, cantidad, piezas,
         seAsignoResurtimiento, cantidadMeses)
      VALUES
        (@folioReceta, @descMedicamento, @indicaciones, @estatus, @cantidad, @piezas,
         @seAsignoResurtimiento, @cantidadMeses)
    `;

    if (decisionTomada === "no") {
      //console.log("⚠ Decisión 'no': insertando registro predeterminado.");
      await transaction.request()
        .input("folioReceta",            sql.Int,     parseInt(folioReceta, 10))
        .input("descMedicamento",       sql.Int,     0)
        .input("indicaciones",          sql.NVarChar,"Sin indicaciones ya que no se asignaron medicamentos.")
        .input("estatus",               sql.Int,     1)
        .input("cantidad",              sql.NVarChar,"Sin tratamiento estimado.")
        .input("piezas",                sql.Int,     0)
        .input("seAsignoResurtimiento", sql.Int,     0)
        .input("cantidadMeses",          sql.Int,     null)
        .query(queryInsertarReceta);

      resultados.push({
        folioReceta,
        status: "success",
        message: "Registro predeterminado insertado en detalleReceta.",
      });

    } else {
      //console.log(`💊 Insertando ${medicamentos.length} medicamento(s)...`);
      for (const med of medicamentos) {
        const {
          descMedicamento,
          indicaciones,
          cantidad,
          piezas,
          resurtir,
          mesesResurtir,
        } = med;
        if (
          !descMedicamento ||
          !indicaciones ||
          !cantidad ||
          !piezas ||
          (resurtir === 1 && (mesesResurtir === null || mesesResurtir === undefined))
        ) {
          console.error("❌ Medicamento con campos faltantes:", med);
          await transaction.rollback();
          return res
            .status(400)
            .json({ message: "Medicamento tiene campos faltantes." });
        }

        await transaction.request()
          .input("folioReceta",            sql.Int,     parseInt(folioReceta, 10))
          .input("descMedicamento",       sql.Int,     parseInt(descMedicamento, 10))
          .input("indicaciones",          sql.NVarChar,indicaciones.trim())
          .input("estatus",               sql.Int,     1)
          .input("cantidad",              sql.NVarChar,cantidad.trim())
          .input("piezas",                sql.Int,     parseInt(piezas, 10))
          .input("seAsignoResurtimiento", sql.Int,     resurtir)
          .input("cantidadMeses",          sql.Int,     resurtir === 1 ? mesesResurtir : null)
          .query(queryInsertarReceta);

        resultados.push({ medicamento: med, status: "success" });
      }

      //? 2) Obtener consulta asociada
      //console.log("🔎 Buscando consulta asociada...");
      const consultaQuery = `
        SELECT clavepaciente, nombrepaciente, claveproveedor, motivoconsulta,
               diagnostico, claveusuario, clavenomina, elpacienteesempleado,
               departamento, edad, sindicato, fechaconsulta
        FROM consultas
        WHERE claveconsulta = @folioReceta
      `;
      const consultaResult = await transaction.request()
        .input("folioReceta", sql.Int, parseInt(folioReceta, 10))
        .query(consultaQuery);

      consultaData = consultaResult.recordset[0];
      if (!consultaData) {
        console.error("❌ Consulta no encontrada.");
        await transaction.rollback();
        return res.status(404).json({ error: "Consulta no encontrada." });
      }
      //console.log("✅ Consulta encontrada:", consultaData);

      //? 3) Calcular nuevo folio surtimiento
      const nuevoFolioResult = await transaction.request()
        .query(`SELECT ISNULL(MAX(FOLIO_SURTIMIENTO),0)+1 AS newFolio FROM SURTIMIENTOS`);
      const newFolio = nuevoFolioResult.recordset[0].newFolio;

      //? 4) Insertar en SURTIMIENTOS
      //console.log("📦 Insertando en SURTIMIENTOS...");
      await transaction.request()
        .input("folioSurtimiento",    sql.Int,      newFolio)
        .input("folioPase",           sql.Int,      parseInt(folioReceta, 10))
        .input("fechaEmision",        sql.DateTime, consultaData.fechaconsulta)
        .input("nomina",              sql.VarChar,  consultaData.clavenomina)
        .input("clavePaciente",       sql.VarChar,  consultaData.clavepaciente)
        .input("nombrePaciente",      sql.VarChar,  consultaData.nombrepaciente)
        .input("edad",                sql.VarChar,  consultaData.edad)
        .input("epacienteEsEmpleado", sql.VarChar,  consultaData.elpacienteesempleado)
        .input("claveMedico",         sql.VarChar,  String(consultaData.claveproveedor))
        .input("diagnostico",         sql.NVarChar, consultaData.diagnostico)
        .input("departamento",        sql.VarChar,  consultaData.departamento)
        .input("estatus",             sql.Int,      1)
        .input("sindicato",           sql.VarChar,  consultaData.sindicato)
        .input("claveUsuario",        sql.VarChar,  String(consultaData.claveusuario))
        .input("estado",              sql.Int,      1)
        .query(`
          INSERT INTO SURTIMIENTOS
            (FOLIO_SURTIMIENTO, FOLIO_PASE, FECHA_EMISION, NOMINA,
             CLAVE_PACIENTE, NOMBRE_PACIENTE, EDAD, ESEMPLEADO, CLAVEMEDICO,
             DIAGNOSTICO, DEPARTAMENTO, ESTADO, SINDICATO, claveusuario, ESTATUS)
          VALUES
            (@folioSurtimiento, @folioPase, @fechaEmision, @nomina,
             @clavePaciente, @nombrePaciente, @edad, @epacienteEsEmpleado, @claveMedico,
             @diagnostico, @departamento, @estatus, @sindicato, @claveUsuario, @estado)
        `);

      //? 5) Insertar en detalleSurtimientos
      //console.log("📦 Insertando en detalleSurtimientos...");
      const queryDetalle = `
        INSERT INTO detalleSurtimientos
          (folioSurtimiento, claveMedicamento, indicaciones, cantidad, estatus, piezas, entregado)
        VALUES
          (@folioSurtimiento, @claveMedicamento, @indicaciones, @cantidad, @estatus, @piezas, @entregado)
      `;
      for (const med of medicamentos) {
        await transaction.request()
          .input("folioSurtimiento", sql.Int,      newFolio)
          .input("claveMedicamento", sql.Int,      parseInt(med.descMedicamento, 10))
          .input("indicaciones",     sql.NVarChar, med.indicaciones.trim())
          .input("cantidad",         sql.NVarChar, med.cantidad.trim())
          .input("estatus",          sql.Int,      1)
          .input("piezas",           sql.Int,      parseInt(med.piezas, 10))
          .input("entregado",        sql.Int,      0)
          .query(queryDetalle);
      }
    }

    //* Confirmamos transacción
    await transaction.commit();
    //console.log("🎉 Transacción COMMIT.");

    //* Registrar actividad (fuera de la transacción)
    if (decisionTomada !== "no") {
      try {
        const pool2 = await connectToDatabase();
        const rawCookies = req.headers.cookie || "";
        const claveusuario = rawCookies
          .split("; ")
          .find((c) => c.startsWith("claveusuario="))
          ?.split("=")[1];
        const userId = claveusuario ? parseInt(claveusuario, 10) : null;

        if (userId) {
          const ip =
            (req.headers["x-forwarded-for"] || "").split(",")[0] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            "0.0.0.0";
          const ua = req.headers["user-agent"] || "";

          await pool2
            .request()
            .input("userId",        sql.Int,     userId)
            .input("accion",        sql.VarChar, "Asignó medicamentos")
            .input("direccionIP",   sql.VarChar, ip)
            .input("agenteUsuario", sql.VarChar, ua)
            .input("claveConsulta", sql.Int,     parseInt(folioReceta, 10))
            .query(`
              INSERT INTO dbo.ActividadUsuarios
                (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, ClaveConsulta)
              VALUES
                (@userId, @accion, DATEADD(MINUTE,-4,GETDATE()), @direccionIP, @agenteUsuario, @claveConsulta)
            `);
          //console.log("👍 Actividad registrada correctamente.");
        } else {
          //console.log("⚠ claveusuario no encontrada; no se registra actividad." );
        }
      } catch (err) {
        console.error("❌ Error al registrar actividad:", err);
      }
    }

    //* Respuesta al cliente
    res.status(200).json({
      message: "Datos guardados correctamente.",
      resultados,
      consulta: consultaData,
      surtimientos:
        decisionTomada !== "no"
          ? "Registro en SURTIMIENTOS insertado."
          : "No se asignaron medicamentos.",
      detalleSurtimientos:
        decisionTomada !== "no"
          ? "Registros en detalleSurtimientos insertados."
          : "No se asignaron medicamentos.",
    });
  } catch (error) {
    console.error("❌ Error inesperado en handler:", error);
    if (transaction) {
      try {
        await transaction.rollback();
        //console.log("🔄 Transacción ROLLBACK.");
      } catch (rbError) {
        console.error("❌ Error al hacer rollback:", rbError);
      }
    }
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
}
