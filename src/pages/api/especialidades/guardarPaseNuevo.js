import { pusher } from "../pusher"; 
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const consultaData = req.body;

    console.log("=== DUMP DE DATOS ANTES DE GUARDAR ===");
    console.log("consultaData:", consultaData);
    console.log("Tipo de fechaconsulta:", typeof consultaData.fechaconsulta, "Valor:", consultaData.fechaconsulta);
    console.log("Tipo de claveproveedor:", typeof consultaData.claveproveedor, "Valor:", consultaData.claveproveedor);
    console.log("Tipo de clavenomina:", typeof consultaData.clavenomina, "Valor:", consultaData.clavenomina);
    console.log("Tipo de clavepaciente:", typeof consultaData.clavepaciente, "Valor:", consultaData.clavepaciente);
    console.log("Tipo de nombrepaciente:", typeof consultaData.nombrepaciente, "Valor:", consultaData.nombrepaciente);
    console.log("Tipo de edad:", typeof consultaData.edad, "Valor:", consultaData.edad);
    console.log("Tipo de clavestatus:", typeof consultaData.clavestatus, "Valor:", consultaData.clavestatus);
    console.log("Tipo de elpacienteesempleado:", typeof consultaData.elpacienteesempleado, "Valor:", consultaData.elpacienteesempleado);
    console.log("Tipo de parentesco:", typeof consultaData.parentesco, "Valor:", consultaData.parentesco);
    console.log("Tipo de claveusuario:", typeof consultaData.claveusuario, "Valor:", consultaData.claveusuario);
    console.log("Tipo de departamento:", typeof consultaData.departamento, "Valor:", consultaData.departamento);
    console.log("Tipo de especialidadinterconsulta:", typeof consultaData.especialidadinterconsulta, "Valor:", consultaData.especialidadinterconsulta);
    console.log("Tipo de costo:", typeof consultaData.costo, "Valor:", consultaData.costo);
    console.log("Tipo de fechacita:", typeof consultaData.fechacita, "Valor:", consultaData.fechacita);
    console.log("Tipo de sindicato:", typeof consultaData.sindicato, "Valor:", consultaData.sindicato);

    try {
      //* Conexión a la base de datos
      const pool = await connectToDatabase();

      console.log("Realizando inserción en la base de datos...");

      const result = await pool
        .request()
        .input("fechaconsulta", sql.DateTime, consultaData.fechaconsulta || null)
        .input("claveproveedor", sql.Int, consultaData.claveproveedor || null)
        .input("clavenomina", sql.NVarChar(15), consultaData.clavenomina ? String(consultaData.clavenomina) : null)
        .input("clavepaciente", sql.NVarChar(15), consultaData.clavepaciente ? String(consultaData.clavepaciente) : null)
        .input("nombrepaciente", sql.NVarChar(50), consultaData.nombrepaciente ? String(consultaData.nombrepaciente) : null)
        .input("edad", sql.NVarChar(50), consultaData.edad ? String(consultaData.edad) : null)
        .input("clavestatus", sql.Int, consultaData.clavestatus || null)
        .input("elpacienteesempleado", sql.NVarChar(1), consultaData.elpacienteesempleado ? String(consultaData.elpacienteesempleado) : null)
        .input("parentesco", sql.NVarChar(50), consultaData.parentesco ? String(consultaData.parentesco) : null)
        .input("claveusuario", sql.Int, consultaData.claveusuario || null)
        .input("departamento", sql.NChar(200), consultaData.departamento ? String(consultaData.departamento) : null)
        .input("especialidadinterconsulta", sql.Int, consultaData.especialidadinterconsulta || null)
        .input("costo", sql.Money, consultaData.costo || 0)
        .input("fechacita", sql.DateTime, consultaData.fechacita || null)
        .input("sindicato", sql.NVarChar(10), consultaData.sindicato ? String(consultaData.sindicato) : null)
        .input("seasignoaespecialidad", sql.NVarChar(1), "S") // Agregamos esta línea para insertar "S"
        .query(`
          INSERT INTO consultas (
            fechaconsulta,
            claveproveedor,
            clavenomina,
            clavepaciente,
            nombrepaciente,
            edad,
            clavestatus,
            elpacienteesempleado,
            parentesco,
            claveusuario,
            departamento,
            especialidadinterconsulta,
            costo,
            fechacita,
            sindicato,
            seasignoaespecialidad
          ) VALUES (
            @fechaconsulta,
            @claveproveedor,
            @clavenomina,
            @clavepaciente,
            @nombrepaciente,
            @edad,
            @clavestatus,
            @elpacienteesempleado,
            @parentesco,
            @claveusuario,
            @departamento,
            @especialidadinterconsulta,
            @costo,
            @fechacita,
            @sindicato,
            @seasignoaespecialidad
          );
          SELECT SCOPE_IDENTITY() AS claveConsulta;
        `);

      const claveConsulta = result.recordset[0].claveConsulta;

      await pusher.trigger("consultas", "nueva-consulta", {
        claveConsulta,
        ...consultaData,
      });

      res
        .status(200)
        .json({ message: "Consulta guardada correctamente.", claveConsulta });
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      res.status(500).json({ message: "Error al guardar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
