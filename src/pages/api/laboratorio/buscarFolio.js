import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

/*
 * Función para formatear la fecha con día de la semana.
 * Si includeTime es false, no se mostrarán las horas y minutos.
 */
function formatFecha(fecha, includeTime = true) {
  if (!fecha) return "N/A";

  const date = new Date(fecha);
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();

  if (includeTime) {
    const horas = date.getUTCHours();
    const minutos = String(date.getUTCMinutes()).padStart(2, "0");
    const periodo = horas >= 12 ? "p.m." : "a.m.";
    const horas12 = horas % 12 === 0 ? 12 : horas % 12;
    return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
  } else {
    return `${diaSemana}, ${dia}/${mes}/${año}`;
  }
}

export default async function handler(req, res) {
  try {
    //* Lee el folio del body (porque en el front se hace POST con { folio })
    const { folio } = req.body;

    if (!folio) {
      return res.status(400).json({ error: "Falta el parámetro folio" });
    }

    //* Conexión a la base de datos
    const pool = await connectToDatabase();

    //? PRIMERA CONSULTA
    //* Buscamos los datos de la tabla LABORATORIOS (unidos a proveedores)
    const queryLaboratorios = `
      SELECT 
        L.FECHA_EMISION,
        L.NOMBRE_PACIENTE,
        L.URL_RESULTADOS,
        L.CLAVE_PACIENTE,
        L.EDAD,
        L.ESEMPLEADO,
        L.NOMINA,
        L.DEPARTAMENTO,
        L.DIAGNOSTICO,
        L.SINDICATO,
        L.FECHA_CITA,
        L.CLAVEMEDICO,
        P.nombreproveedor AS nombreproveedor
      FROM LABORATORIOS L
      INNER JOIN proveedores P
        ON L.CLAVEMEDICO = P.claveproveedor
      WHERE 
        L.FOLIO_ORDEN_LABORATORIO = @folio
        AND L.ESTATUS = 1
    `;

    const resultLaboratorios = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(queryLaboratorios);

    //! Si no hay resultados en LABORATORIOS, retornamos 404
    if (resultLaboratorios.recordset.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros." });
    }

    //? SEGUNDA CONSULTA
    //* Buscamos los estudios asociados al folio en la tabla detalleLaboratorio
    //* y hacemos el JOIN para obtener el campo 'estudio' de la tabla 'ESTUDIOS'
    const queryEstudios = `
      SELECT e.estudio
      FROM detalleLaboratorio dl
      INNER JOIN ESTUDIOS e
        ON dl.claveEstudio = e.claveEstudio
      WHERE dl.folio_orden_laboratorio = @folio
    `;

    const resultEstudios = await pool
      .request()
      .input("folio", sql.Int, folio)
      .query(queryEstudios);

    //* Creamos un arreglo con los "estudio" encontrados
    const listaEstudios = resultEstudios.recordset.map(row => row.estudio);

    //* Procesamos los registros, realizando la conversión de ESEMPLEADO
    const dataFormateada = [];
    for (const row of resultLaboratorios.recordset) {
      let empleadoStr = "";
      //* Si ESEMPLEADO es "S", se mantiene como "SI"
      if (row.ESEMPLEADO === "S") {
        empleadoStr = "SI";
      } else {
        //* Si es "N", se hace la consulta en BENEFICIARIO usando CLAVE_PACIENTE
        const resultBenef = await pool
          .request()
          .input("clavePaciente", sql.VarChar, row.CLAVE_PACIENTE)
          .query("SELECT PARENTESCO FROM BENEFICIARIO WHERE ID_BENEFICIARIO = @clavePaciente");

        let parentescoId = null;
        if (resultBenef.recordset.length > 0) {
          parentescoId = resultBenef.recordset[0].PARENTESCO;
        }

        let parentescoTexto = "Desconocido";
        if (parentescoId) {
          //* Ahora se consulta en la tabla PARENTESCO para obtener el texto
          const resultParent = await pool
            .request()
            .input("parentId", sql.Int, parentescoId)
            .query("SELECT parentesco FROM PARENTESCO WHERE ID_PARENTESCO = @parentId");
          if (resultParent.recordset.length > 0) {
            parentescoTexto = resultParent.recordset[0].parentesco;
          }
        }
        empleadoStr = `NO - ${parentescoTexto}`;
      }

      dataFormateada.push({
        FECHA_EMISION: formatFecha(row.FECHA_EMISION, true),
        NOMBRE_PACIENTE: row.NOMBRE_PACIENTE,
        NOMINA: row.NOMINA,
        EDAD: row.EDAD,
        URL_RESULTADOS: row.URL_RESULTADOS,
        ESEMPLEADO: empleadoStr,
        DEPARTAMENTO: row.DEPARTAMENTO,
        DIAGNOSTICO: row.DIAGNOSTICO,
        SINDICATO: row.SINDICATO,
        FECHA_CITA: formatFecha(row.FECHA_CITA, false),
        CLAVEMEDICO: row.CLAVEMEDICO,
        NOMBREPROVEEDOR: row.nombreproveedor,
        //* Agregamos la lista de estudios al objeto
        ESTUDIOS: listaEstudios,
      });
    }

    //* Retornamos los datos (si solo tienes 1 registro de LABORATORIOS, puedes enviar dataFormateada[0])
    return res.status(200).json(dataFormateada);

  } catch (error) {
    console.error("Error en buscarFolio:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
