import { getConsultaData } from "./getConsultaData";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { claveconsulta } = req.query; //* Extrae claveconsulta de la URL

    if (!claveconsulta) {
      return res.status(400).json({ message: "Falta el parámetro claveconsulta" });
    }

    //console.log("📡 Recibiendo claveconsulta:", claveconsulta);

    const consultaData = await getConsultaData(claveconsulta);

    if (!consultaData.consulta) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    //console.log("✅ Datos obtenidos correctamente:", consultaData);
    res.status(200).json(consultaData);
  } catch (error) {
    console.error("❌ Error en API recetaPaciente:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
}
