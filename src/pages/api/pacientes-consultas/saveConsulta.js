import { pusher } from "../pusher"; 
import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const consultaData = req.body;

    try {
      //* Conexión a la base de datos
      const pool = await connectToDatabase();

      //* Si clavepaciente es nulo, usa clavenomina como valor predeterminado
      const clavePaciente = consultaData.clavepaciente ?? consultaData.clavenomina;

      //* Inserción en la base de datos
      const result = await pool
        .request()
        .input("fechaconsulta", sql.VarChar, consultaData.fechaconsulta)
        .input("clavenomina", sql.VarChar, consultaData.clavenomina)
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
        .input("clavepaciente", sql.VarChar, clavePaciente) 
        .input("departamento", sql.VarChar, consultaData.departamento)
        .input("sindicato", sql.VarChar, consultaData.sindicato)
        .query(`
          INSERT INTO consultas (
            fechaconsulta, clavenomina, presionarterialpaciente, temperaturapaciente, 
            pulsosxminutopaciente, respiracionpaciente, estaturapaciente, pesopaciente, 
            glucosapaciente, nombrepaciente, edad, clavestatus, elpacienteesempleado, 
            parentesco, clavepaciente, departamento, sindicato
          ) VALUES (
            @fechaconsulta, @clavenomina, @presionarterialpaciente, @temperaturapaciente, 
            @pulsosxminutopaciente, @respiracionpaciente, @estaturapaciente, @pesopaciente, 
            @glucosapaciente, @nombrepaciente, @edad, @clavestatus, @elpacienteesempleado, 
            @parentesco, @clavepaciente, @departamento, @sindicato
          );
          SELECT SCOPE_IDENTITY() AS claveConsulta;
        `);

      const claveConsulta = result.recordset[0].claveConsulta;

      //* Enviar evento a Pusher
      await pusher.trigger("consultas", "nueva-consulta", {
        claveConsulta,
        ...consultaData,
      });

      res
        .status(200)
        .json({ message: "Consulta guardada correctamente y evento enviado.", claveConsulta });
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      res.status(500).json({ message: "Error al guardar la consulta." });
    }
  } else {
    res.status(405).json({ message: "Método no permitido." });
  }
}
