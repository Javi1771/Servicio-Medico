import { connectToDatabase } from "./connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const consultaData = req.body;

    try {
      const pool = await connectToDatabase();

      await pool
        .request()
        .input("fechaconsulta", sql.VarChar, consultaData.fechaconsulta)
        .input("clavenomina", sql.Int, consultaData.clavenomina)
        .input("presionarterialpaciente", sql.VarChar, consultaData.presionarterialpaciente)
        .input("temperaturapaciente", sql.Decimal, consultaData.temperaturapaciente)
        .input("pulsosxminutopaciente", sql.Int, consultaData.pulsosxminutopaciente)
        .input("respiracionpaciente", sql.Int, consultaData.respiracionpaciente)
        .input("estaturapaciente", sql.Decimal, consultaData.estaturapaciente)
        .input("pesopaciente", sql.Decimal, consultaData.pesopaciente)
        .input("glucosapaciente", sql.Int, consultaData.glucosapaciente)
        .input("nombrepaciente", sql.VarChar, consultaData.nombrepaciente)
        .input("edad", sql.VarChar, consultaData.edad)
        .input("clavestatus", sql.Int, consultaData.clavestatus)
        .input("elpacienteesempleado", sql.VarChar, consultaData.elpacienteesempleado)
        .input("parentesco", sql.Int, consultaData.parentesco)
        .input("departamento", sql.VarChar, consultaData.departamento)
        .input("sindicato", sql.VarChar, consultaData.sindicato)
        .query(`
          INSERT INTO consultas (
            fechaconsulta, clavenomina, presionarterialpaciente, temperaturapaciente, 
            pulsosxminutopaciente, respiracionpaciente, estaturapaciente, pesopaciente, 
            glucosapaciente, nombrepaciente, edad, clavestatus, elpacienteesempleado, 
            parentesco, departamento, sindicato
          ) VALUES (
            @fechaconsulta, @clavenomina, @presionarterialpaciente, @temperaturapaciente, 
            @pulsosxminutopaciente, @respiracionpaciente, @estaturapaciente, @pesopaciente, 
            @glucosapaciente, @nombrepaciente, @edad, @clavestatus, @elpacienteesempleado, 
            @parentesco, @departamento, @sindicato 
          )
        `);

      res.status(200).json({ message: "Consulta guardada correctamente." });
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      res.status(500).json({ message: "Error al guardar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
