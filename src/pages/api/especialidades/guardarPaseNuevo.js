import { pusher } from "../pusher"; 
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const consultaData = req.body;

    console.log("=== DUMP DE DATOS ANTES DE GUARDAR ===");
    console.log("consultaData:", consultaData);

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
        .input(
          "parentesco", 
          sql.Int, 
          consultaData.parentesco !== undefined && consultaData.parentesco !== null ? consultaData.parentesco : null
        ) // Aseguramos que 0 no sea sobrescrito como null
        .input("claveusuario", sql.Int, consultaData.claveusuario || null)
        .input("departamento", sql.NChar(200), consultaData.departamento ? String(consultaData.departamento) : null)
        .input("especialidadinterconsulta", sql.Int, consultaData.especialidadinterconsulta || null)
        .input("costo", sql.Money, consultaData.costo || 0)
        .input("fechacita", sql.DateTime, consultaData.fechacita ? new Date(consultaData.fechacita) : null)
        .input("sindicato", sql.NVarChar(10), consultaData.sindicato ? String(consultaData.sindicato) : null)
        .input("seasignoaespecialidad", sql.NVarChar(1), "S") // Agregamos esta línea para insertar "S"
        .query(`
          INSERT INTO consultas (
            fechaconsulta, claveproveedor, clavenomina, clavepaciente, nombrepaciente, edad,
            clavestatus, elpacienteesempleado, parentesco, claveusuario, departamento, especialidadinterconsulta,
            costo, fechacita, sindicato, seasignoaespecialidad
          ) VALUES (
            @fechaconsulta, @claveproveedor, @clavenomina, @clavepaciente, @nombrepaciente, @edad,
            @clavestatus, @elpacienteesempleado, @parentesco, @claveusuario, @departamento, @especialidadinterconsulta,
            @costo, @fechacita, @sindicato, @seasignoaespecialidad
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
