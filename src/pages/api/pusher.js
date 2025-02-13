import Pusher from "pusher";
import https from "https";  

//* Crear un agente HTTPS personalizado para permitir certificados autofirmados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, //* Permite certificados autofirmados
});

//* Configuración de Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
  agent: httpsAgent, //* Usar el agente HTTPS personalizado si es necesario
  wsHost: process.env.NEXT_PUBLIC_BASE_URL.replace("https://", "").replace("http://", ""), //* 💡 Usar dominio sin protocolo
  wsPort: 3005,  //* Puerto correcto en producción
  forceTLS: true, //* Forzar conexión segura
  disableStats: true, //* Desactivar métricas para evitar sobrecarga
});

//* Exporta el handler para manejar solicitudes HTTP
async function handler(req, res) {
  if (req.method === "POST") {
    const { channel, event, data } = req.body;

    try {
      console.log(`📡 Enviando evento "${event}" al canal "${channel}" con datos:`, JSON.stringify(data, null, 2));
      
      await pusher.trigger(channel, event, data);

      res.status(200).json({ message: "✅ Evento enviado a Pusher correctamente." });
    } catch (error) {
      console.error("❌ Error al enviar evento a Pusher:", error);
      res.status(500).json({ error: "Error al enviar evento a Pusher", details: error.message });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}

export { handler as default, pusher };


// import Pusher from "pusher";

// //* Configuración de Pusher
// const pusher = new Pusher({
//   appId: process.env.PUSHER_APP_ID,
//   key: process.env.PUSHER_KEY,
//   secret: process.env.PUSHER_SECRET,
//   cluster: process.env.PUSHER_CLUSTER,
//   useTLS: true, //* usa ssl si es necesario
//   host: process.env.NEXT_PUBLIC_PUSHER_HOST || "mpiosjr.hopto.org", //* usar host sin http o https
//   port: 6001, //* pusher normalmente usa 6001 en servidores personalizados
//   forceTLS: process.env.NEXT_PUBLIC_PUSHER_HOST.includes("https"), //* solo activa tls si el host es https
//   disableStats: true, //* evita métricas innecesarias
// });

// //* Exporta el handler para manejar solicitudes HTTP
// async function handler(req, res) {
//   if (req.method === "POST") {
//     const { channel, event, data } = req.body;

//     try {
//       console.log(`📡 Enviando evento "${event}" al canal "${channel}" con datos:`, JSON.stringify(data, null, 2));
      
//       await pusher.trigger(channel, event, data);

//       res.status(200).json({ message: "✅ Evento enviado a Pusher correctamente." });
//     } catch (error) {
//       console.error("❌ Error al enviar evento a Pusher:", error);
//       res.status(500).json({ error: "Error al enviar evento a Pusher", details: error.message });
//     }
//   } else {
//     res.status(405).json({ error: "Método no permitido" });
//   }
// }

// export { handler as default, pusher };
