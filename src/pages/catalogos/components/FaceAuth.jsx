// components/FaceAuth.jsx (versión depurada)
import { useRef, useState, useEffect } from "react";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";

export default function FaceAuth({ storedImageUrl }) {
  console.log("[FaceAuth] Recibimos storedImageUrl:", storedImageUrl);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const { modelsLoaded, compareFaces } = useFaceRecognition();

  useEffect(() => {
    // Activar la cámara
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (error) {
        console.error("No se pudo acceder a la cámara:", error);
        setMessage("Permiso de cámara denegado o no disponible.");
        setCameraActive(false);
      }
    };
    startCamera();

    // Al desmontar, apagar la cámara
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) {
      setMessage("No se puede capturar foto: cámara inactiva.");
      return;
    }
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    const ctx = canvasRef.current.getContext("2d");

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    setMessage("Foto capturada.");
    console.log("[capturePhoto] Foto capturada en el canvas");
  };

  const handleVerify = async () => {
    console.log("[handleVerify] Iniciando verificación con URL:", storedImageUrl);

    if (!storedImageUrl) {
      setMessage("No hay URL de imagen almacenada para comparar.");
      console.log("[handleVerify] storedImageUrl está vacío");
      return;
    }
    if (!canvasRef.current) {
      setMessage("No hay imagen capturada en el canvas.");
      console.log("[handleVerify] No hay canvas con foto capturada");
      return;
    }
    if (!modelsLoaded) {
      setMessage("Los modelos no están listos. Espera un momento.");
      console.log("[handleVerify] Los modelos face-api aún no se han cargado");
      return;
    }

    setMessage("Comparando rostros...");
    try {
      const result = await compareFaces(storedImageUrl, canvasRef.current);
      console.log("[handleVerify] Resultado de compareFaces:", result);

      if (result.match) {
        setMessage(
          `¡Coincide! Distancia: ${result.distance?.toFixed(4)}`
        );
      } else {
        setMessage(
          `No coincide. Distancia: ${result.distance?.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error("[handleVerify] Error en la comparación:", error);
      setMessage("Ocurrió un error al comparar.");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Verificación de Rostro (Depurada)</h2>

      {/* Mostramos la URL a comparar en pantalla */}
      <p style={{ color: "gray", fontSize: "0.9em" }}>
        URL a comparar: <strong>{storedImageUrl || "N/A"}</strong>
      </p>

      {/* Mensaje general en pantalla */}
      {message && <p>{message}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        {/* VIDEO en vivo */}
        <div>
          <video
            ref={videoRef}
            style={{ width: "320px", height: "240px", background: "#000" }}
            muted
          />
        </div>
        {/* CANVAS donde capturamos la foto */}
        <div>
          <canvas
            ref={canvasRef}
            style={{ width: "320px", height: "240px", border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={capturePhoto}>Capturar Foto</button>
        <button onClick={handleVerify} style={{ marginLeft: 10 }}>
          Verificar
        </button>
      </div>
    </div>
  );
}
