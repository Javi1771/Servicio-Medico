export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Método no permitido" });
    }
  
    const { numNomina } = req.body;
  
    // Validación básica
    if (!numNomina) {
      console.log("[ERROR] Número de nómina no proporcionado.");
      return res.status(400).json({ message: "Número de nómina es obligatorio." });
    }
  
    try {
      console.log(`[INFO] Obteniendo documentos para nómina: ${numNomina}`);
  
      // Llamada al endpoint externo
      const response = await fetch(
        "https://sanjuandelrio.gob.mx/tramites-sjr/Api/principal/get_documentsWorkers"
      );
      const data = await response.json();
  
      // Verificar la estructura de la respuesta
      console.log("[DEBUG] Respuesta del endpoint externo:", data);
  
      if (!data.success) {
        console.log("[ERROR] El endpoint externo devolvió un error.");
        return res.status(500).json({ message: "Error al obtener datos del endpoint externo." });
      }
  
      // Filtrar el documento correspondiente
      const actaConcubinato = data.data.find(
        (doc) => doc.nomina === numNomina && doc.documento === "actaConcubinato.pdf"
      );
  
      console.log("[DEBUG] Resultado del filtro:", actaConcubinato);
  
      if (!actaConcubinato) {
        console.log("[ERROR] No se encontró acta de concubinato para la nómina proporcionada.");
        return res
          .status(404)
          .json({ message: "Acta de Concubinato no encontrada para esta nómina." });
      }
  
      console.log("[INFO] Acta de Concubinato encontrada. URL:", actaConcubinato.url);
  
      // Retornar el URL del acta de concubinato
      return res.status(200).json({ success: true, url: actaConcubinato.url });
    } catch (error) {
      console.error("[ERROR] Error al procesar la solicitud:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  }
  