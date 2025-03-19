import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  //? 1. Extraer datos generales del body
  const {
    claveconsulta,
    clavenomina,
    clavepaciente,
    nombrepaciente,
    edad,
    elpacienteesempleado,
    departamento,
    sindicato,
    laboratorios,
  } = req.body;

  console.log("Datos recibidos desde el front:", req.body);

  //? 2. Extraer 'claveusuario' de la cookie
  let claveusuario = "";
  const cookie = req.headers.cookie || "";
  if (cookie) {
    const match = cookie.match(/claveusuario=([^;]+)/);
    if (match) {
      claveusuario = match[1];
    }
  }

  try {
    const pool = await connectToDatabase();

    //? 3. Iterar sobre cada laboratorio a guardar

    for (let i = 0; i < laboratorios.length; i++) {
      const { claveproveedor, diagnostico, estudios } = laboratorios[i];

      //* ======================================
      //? 3.1 Obtener el último valor de FOLIO_ORDEN_LABORATORIO y sumarle 1
      //* ======================================

      const maxQuery =
        "SELECT MAX(FOLIO_ORDEN_LABORATORIO) as maxFolio FROM [LABORATORIOS]";
      const maxResult = await pool.request().query(maxQuery);

      let nuevoFolio = 1;
      if (
        maxResult.recordset &&
        maxResult.recordset.length > 0 &&
        maxResult.recordset[0].maxFolio !== null
      ) {
        nuevoFolio = Number(maxResult.recordset[0].maxFolio) + 1;
      }

      //* ======================================
      //? 3.2 Insertar en la tabla [LABORATORIOS]
      //* ======================================

      await pool
        .request()
        .input("folioOrden", sql.Int, nuevoFolio)
        .input("claveconsulta", sql.VarChar, claveconsulta)
        .input("clavenomina", sql.VarChar, clavenomina)
        .input("clavepaciente", sql.VarChar, clavepaciente)
        .input("nombrepaciente", sql.VarChar, nombrepaciente)
        .input("edad", sql.VarChar, edad)
        .input("elpacienteesempleado", sql.VarChar, elpacienteesempleado)
        .input("claveproveedor", sql.Int, claveproveedor)
        .input("diagnostico", sql.VarChar, diagnostico)
        .input("departamento", sql.VarChar, departamento)
        .input("sindicato", sql.VarChar, sindicato)
        .input("claveusuario", sql.VarChar, claveusuario).query(`
          INSERT INTO [LABORATORIOS] (
            FOLIO_ORDEN_LABORATORIO,
            CLAVECONSULTA,
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
            SINDICATO,
            claveusuario
          )
          VALUES (
            @folioOrden,
            @claveconsulta,
            DATEADD(MINUTE, -1, GETDATE()),
            @clavenomina,
            @clavepaciente,
            @nombrepaciente,
            @edad,
            @elpacienteesempleado,
            @claveproveedor,
            @diagnostico,
            @departamento,
            1,
            @sindicato,
            @claveusuario
          )
        `);

      console.log(
        `LABORATORIO INSERTADO: FOLIO ${nuevoFolio}, CLAVEPROVEEDOR ${claveproveedor}`
      );

      //* ======================================
      //? 3.3 Registrar la actividad en ActividadUsuarios
      //* ======================================

      const rawCookies = req.headers.cookie || "";
      const claveusuarioCookie = rawCookies
        .split("; ")
        .find((row) => row.startsWith("claveusuario="))
        ?.split("=")[1];
      const claveusuarioInt = claveusuarioCookie
        ? Number(claveusuarioCookie)
        : null;

        let ip =
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null);
      
      const userAgent = req.headers["user-agent"] || "";

      if (claveusuarioInt !== null) {
        await pool
          .request()
          .input("userId", sql.Int, claveusuarioInt)
          .input(
            "accion",
            sql.VarChar,
            "Capturó una orden de estudio de laboratorio"
          )
          .input("direccionIP", sql.VarChar, ip)
          .input("agenteUsuario", sql.VarChar, userAgent)
          .input("idLaboratorio", sql.Int, nuevoFolio).query(`
            INSERT INTO dbo.ActividadUsuarios 
              (IdUsuario, Accion, FechaHora, DireccionIP, AgenteUsuario, IdLaboratorio)
            VALUES 
              (@userId, @accion, DATEADD(MINUTE, -1, GETDATE()), @direccionIP, @agenteUsuario, @idLaboratorio)
          `);
        console.log("Actividad registrada en ActividadUsuarios.");
      } else {
        console.log("No se pudo registrar la actividad: falta claveusuario.");
      }

      //* ======================================
      //? 3.4 Insertar cada estudio en detalleLaboratorio
      //? asumiendo que 'estudios' es un array de claveEstudio
      //* ======================================

      if (Array.isArray(estudios)) {
        for (let j = 0; j < estudios.length; j++) {
          const claveEstudio = Number(estudios[j]);
          await pool
            .request()
            .input("folioOrden", sql.Int, nuevoFolio)
            .input("claveEstudio", sql.Int, claveEstudio).query(`
              INSERT INTO detalleLaboratorio (folio_orden_laboratorio, claveEstudio, estatus)
              VALUES (@folioOrden, @claveEstudio, 1)
            `);

          console.log(
            `DETALLE INSERTADO: FOLIO ${nuevoFolio}, CLAVE ESTUDIO ${claveEstudio}`
          );
        }
      }
    }

    //* Si todo salió bien, enviamos respuesta
    res
      .status(200)
      .json({ message: "Todas las órdenes se insertaron correctamente" });
  } catch (error) {
    console.error("Error al insertar orden de laboratorio:", error);
    res
      .status(500)
      .json({ message: "Error al insertar orden", error: error.message });
  }
}
