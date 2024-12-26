import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { clavepaciente, clavenomina } = req.query;

    if (!clavepaciente || !clavenomina) {
      return res.status(400).json({
        ok: false,
        error: "Debe proporcionar clavenomina y clavepaciente.",
      });
    }

    try {
      const pool = await connectToDatabase();

      // Buscar claveconsulta en la tabla consultas
      const queryConsultas = `
        SELECT claveconsulta
        FROM [PRESIDENCIA].[dbo].[consultas]
        WHERE clavepaciente = @clavepaciente AND clavenomina = @clavenomina
      `;

      const consultasResult = await pool
        .request()
        .input("clavepaciente", sql.NVarChar, clavepaciente)
        .input("clavenomina", sql.NVarChar, clavenomina)
        .query(queryConsultas);

      const claveConsultas = consultasResult.recordset.map(
        (row) => row.claveconsulta
      );

      if (claveConsultas.length === 0) {
        return res.status(200).json({ ok: true, historial: [] });
      }

      // Buscar en la tabla detalleReceta usando las claves de consulta encontradas
      const queryDetalleReceta = `
        SELECT 
          folioReceta,
          indicaciones,
          cantidad,
          descMedicamento
        FROM [PRESIDENCIA].[dbo].[detalleReceta]
        WHERE folioReceta IN (${claveConsultas.join(",")})
      `;

      const detalleRecetaResult = await pool
        .request()
        .query(queryDetalleReceta);

      const detalleRecetas = detalleRecetaResult.recordset;

      if (detalleRecetas.length === 0) {
        return res.status(200).json({ ok: true, historial: [] });
      }

      // Obtener los IDs únicos de descMedicamento
      const descMedicamentoIds = [
        ...new Set(detalleRecetas.map((receta) => receta.descMedicamento)),
      ];

      // Buscar nombres de medicamentos en la tabla MEDICAMENTOS
      let medicamentosMap = {};
      if (descMedicamentoIds.length > 0) {
        const queryMedicamentos = `
          SELECT 
            CLAVEMEDICAMENTO,
            MEDICAMENTO
          FROM [PRESIDENCIA].[dbo].[MEDICAMENTOS]
          WHERE CLAVEMEDICAMENTO IN (${descMedicamentoIds.join(",")})
        `;

        const medicamentosResult = await pool
          .request()
          .query(queryMedicamentos);

        const medicamentos = medicamentosResult.recordset;

        // Crear un mapa de medicamentos
        medicamentosMap = medicamentos.reduce((acc, med) => {
          acc[med.CLAVEMEDICAMENTO] = med.MEDICAMENTO;
          return acc;
        }, {});
      }

      // Combinar los datos del historial
      const historial = detalleRecetas.map((receta) => ({
        folioReceta: receta.folioReceta,
        indicaciones: receta.indicaciones,
        tratamiento: receta.cantidad,
        medicamento:
          medicamentosMap[receta.descMedicamento] || "Medicamento desconocido",
      }));

      res.status(200).json({ ok: true, historial });
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({
        ok: false,
        error: "Error al obtener el historial de medicamentos",
      });
    }
  } else {
    res.status(405).json({ ok: false, error: "Método no permitido" });
  }
}
