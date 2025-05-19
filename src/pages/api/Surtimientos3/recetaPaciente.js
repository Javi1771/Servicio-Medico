// src/pages/api/Surtimientos3/recetaPaciente.js
import { getConsultaDataSurtimientos } 
  from "./getConsultaDataSurtimientos";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }
  const { claveconsulta } = req.query;
  if (!claveconsulta) {
    return res.status(400).json({ message: "Falta parámetro claveconsulta" });
  }
  try {
    const data = await getConsultaDataSurtimientos(claveconsulta);
    if (!data.consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error en API recetaPaciente:", err);
    return res.status(500).json({ message: "Error interno", error: err.message });
  }
}
