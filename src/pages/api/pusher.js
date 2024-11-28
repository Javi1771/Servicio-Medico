import Pusher from "pusher";
import https from "https";  // Asegúrate de importar el módulo https

// Crea un agente HTTPS personalizado para permitir certificados autofirmados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Permite certificados autofirmados
});

// Configuración de Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
  agent: httpsAgent, // Usar el agente HTTPS personalizado
});

// Exporta el handler para manejar solicitudes HTTP
async function handler(req, res) {
  if (req.method === "POST") {
    const { channel, event, data } = req.body;

    try {
      await pusher.trigger(channel, event, data);
      res.status(200).json({ message: "Evento enviado a Pusher" });
    } catch (error) {
      console.error("Error al enviar evento a Pusher:", error);
      res.status(500).json({ error: "Error al enviar evento a Pusher" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}

// Exporta tanto el handler como la instancia de Pusher
export { handler as default, pusher };
