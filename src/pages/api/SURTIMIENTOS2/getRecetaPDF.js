import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { folio } = req.query;
  if (!folio) {
    return res.status(400).json({ message: "Folio es requerido" });
  }

  try {
    const pool = await connectToDatabase();

    console.log("🔍 Buscando en SURTIMIENTOS con FOLIO_PASE:", folio);

    // 1️⃣ Obtener el FOLIO_SURTIMIENTO, NOMINA, CLAVEMEDICO y CLAVEUSUARIO
    const querySurtimientos = `
      SELECT TOP 1 FOLIO_SURTIMIENTO, NOMINA, CLAVEMEDICO, CLAVEUSUARIO
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
      WHERE FOLIO_PASE = @folio
      ORDER BY FOLIO_SURTIMIENTO DESC
    `;

    const resultSurtimientos = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(querySurtimientos);

    if (resultSurtimientos.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró el registro en SURTIMIENTOS." });
    }

    const { FOLIO_SURTIMIENTO: folioSurtimiento, NOMINA, CLAVEMEDICO, CLAVEUSUARIO } = resultSurtimientos.recordset[0];

    console.log("✅ Se encontró el FOLIO_SURTIMIENTO más reciente:", folioSurtimiento);
    console.log("📌 Número de nómina (NOMINA):", NOMINA);
    console.log("🩺 Clave del médico:", CLAVEMEDICO);
    console.log("✍ Clave del usuario que elaboró:", CLAVEUSUARIO);

    // 2️⃣ Obtener los medicamentos del detalleSurtimientos
    console.log("🔍 Buscando medicamentos en detalleSurtimientos...");
    const queryDetalle = `
      SELECT 
        ds.claveMedicamento, 
        mn.medicamento AS nombreMedicamento,
        ds.indicaciones, 
        ds.cantidad, 
        ds.piezas
      FROM [PRESIDENCIA].[dbo].[detalleSurtimientos] ds
      LEFT JOIN [PRESIDENCIA].[dbo].[MEDICAMENTOS_NEW] mn ON ds.claveMedicamento = mn.claveMedicamento
      WHERE ds.folioSurtimiento = @folioSurtimiento
    `;

    const resultDetalle = await pool.request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .query(queryDetalle);

    const medicamentos = resultDetalle.recordset;
    console.log("📌 Medicamentos obtenidos con nombres:", medicamentos);

    // 3️⃣ Obtener información general del SURTIMIENTOS
    const querySurtimientoData = `
      SELECT 
        FECHA_EMISION,
        NOMINA,
        NOMBRE_PACIENTE,
        EDAD,
        DIAGNOSTICO,
        DEPARTAMENTO,
        FECHA_DESPACHO,
        SINDICATO
      FROM [PRESIDENCIA].[dbo].[SURTIMIENTOS]
      WHERE FOLIO_SURTIMIENTO = @folioSurtimiento
    `;

    const resultSurtimientoData = await pool.request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .query(querySurtimientoData);

    if (resultSurtimientoData.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontró la información del surtimiento." });
    }

    const surtimientoData = resultSurtimientoData.recordset[0];

    // 4️⃣ Obtener el nombre del empleado usando el endpoint interno /api/empleado (opción B)
    let nombreEmpleado = "No disponible";
    if (NOMINA) {
      try {
        console.log("📡 Llamando a /api/empleado para obtener nombre del empleado con NOMINA =", NOMINA);
        // Se usa una URL base absoluta configurada vía variable de entorno o usando req.headers.origin
        const baseUrl = process.env.BASE_URL || req.headers.origin || "http://localhost:3000";
        const responseEmpleado = await fetch(`${baseUrl}/api/empleado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ num_nom: NOMINA })
        });
        const empleadoData = await responseEmpleado.json();
        if (empleadoData && empleadoData.nombre) {
          nombreEmpleado = `${empleadoData.nombre || ""} ${empleadoData.a_paterno || ""} ${empleadoData.a_materno || ""}`.trim();
          console.log("👤 Nombre completo del empleado obtenido:", nombreEmpleado);
        } else {
          console.log("⚠ No se encontraron datos del empleado desde /api/empleado.");
        }
      } catch (error) {
        console.error("❌ Error llamando a /api/empleado:", error);
      }
    }

    // 5️⃣ Obtener el nombre y cédula del doctor
    let nombreDoctor = "Desconocido";
    let cedulaDoctor = "Cédula no disponible";

    if (CLAVEMEDICO) {
      console.log("🔍 Buscando datos del doctor en proveedores...");
      const queryDoctor = `
        SELECT nombreproveedor, cedulaproveedor
        FROM [PRESIDENCIA].[dbo].[proveedores]
        WHERE claveproveedor = @CLAVEMEDICO
      `;

      const resultDoctor = await pool.request()
        .input("CLAVEMEDICO", sql.Int, CLAVEMEDICO)
        .query(queryDoctor);

      if (resultDoctor.recordset.length > 0) {
        nombreDoctor = resultDoctor.recordset[0].nombreproveedor;
        cedulaDoctor = resultDoctor.recordset[0].cedulaproveedor ?? "Cédula no disponible";
      }

      console.log("🩺 Nombre del doctor obtenido:", nombreDoctor);
      console.log("📜 Cédula del doctor obtenida:", cedulaDoctor);
    }

    // 6️⃣ Obtener el nombre del usuario que elaboró la receta
    let nombreElaboro = "Desconocido";

    if (CLAVEUSUARIO) {
      console.log("🔍 Buscando quién elaboró en proveedores...");
      const queryElaboro = `
        SELECT nombreproveedor
        FROM [PRESIDENCIA].[dbo].[proveedores]
        WHERE claveproveedor = @CLAVEUSUARIO
      `;

      const resultElaboro = await pool.request()
        .input("CLAVEUSUARIO", sql.Int, CLAVEUSUARIO)
        .query(queryElaboro);

      if (resultElaboro.recordset.length > 0) {
        nombreElaboro = resultElaboro.recordset[0].nombreproveedor;
      }

      console.log("✍ Nombre del usuario que elaboró la receta:", nombreElaboro);
    }

    // 7️⃣ Enviar la respuesta con los datos actualizados
    return res.status(200).json({
      ...surtimientoData,
      medicamentos,
      empleado: nombreEmpleado,
      doctor: nombreDoctor,
      cedula: cedulaDoctor,
      elaboro: nombreElaboro,
    });
  } catch (error) {
    console.error("❌ Error al obtener la receta:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
