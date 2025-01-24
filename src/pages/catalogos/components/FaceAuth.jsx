// components/FaceAuth.jsx
import { useRef, useState, useEffect } from "react";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";
import * as faceapi from "face-api.js";

export default function FaceAuth({ beneficiaries }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [matchedBeneficiary, setMatchedBeneficiary] = useState(null);

  const { modelsLoaded, getDescriptorFromCanvas } = useFaceRecognition();

  // 1. Iniciar cámara
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      } catch (error) {
        console.error("No se pudo acceder a la cámara:", error);
        setMessage("Permiso de cámara denegado o no disponible.");
        setCameraActive(false);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Capturar foto en <canvas>
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
  };

  // 3. Comparar la foto capturada con todos los beneficiarios (DESCRIPTOR_FACIAL)
  const handleVerify = async () => {
    if (!modelsLoaded) {
      setMessage("Los modelos no están listos. Espera un momento.");
      return;
    }
    if (!canvasRef.current) {
      setMessage("No hay imagen capturada en el canvas.");
      return;
    }
    if (!beneficiaries || beneficiaries.length === 0) {
      setMessage("No hay beneficiarios disponibles para comparar.");
      return;
    }

    setMatchedBeneficiary(null);
    setMessage("Obteniendo descriptor de la foto tomada...");

    // 3.1 Obtener descriptor de la foto tomada
    const descriptorCaptured = await getDescriptorFromCanvas(canvasRef.current);
    if (!descriptorCaptured) {
      setMessage("No se detectó un rostro en la foto tomada.");
      return;
    }

    // 3.2 Iterar sobre cada beneficiario
    setMessage("Comparando descriptores...");
    let bestMatch = null;
    let minDistance = Infinity;
    const threshold = 0.6;

    for (const beneficiary of beneficiaries) {
      // 'DESCRIPTOR_FACIAL' es un string JSON. Lo parseamos a Float32Array.
      const jsonArray = JSON.parse(beneficiary.DESCRIPTOR_FACIAL); // Devuelve array JS
      const storedDescriptor = new Float32Array(jsonArray); // Convertimos array JS a Float32Array

      // Calculamos la distancia euclidiana
      const distance = faceapi.euclideanDistance(descriptorCaptured, storedDescriptor);

      // Si es menor al threshold y además es la menor distancia encontrada, lo guardamos
      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        bestMatch = beneficiary;
      }
    }

    // 3.3 Mostrar resultado
    if (bestMatch) {
      setMatchedBeneficiary(bestMatch);
      setMessage(
        `¡Coincide con ID: ${bestMatch.ID_BENEFICIARIO}, distancia: ${minDistance.toFixed(
          4
        )}`
      );
    } else {
      setMessage("No se encontraron coincidencias (threshold = 0.6).");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.subtitle}>Verificación de Rostro</h2>

      <div style={styles.card}>
        {message && <p style={styles.statusMessage}>{message}</p>}

        {matchedBeneficiary && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Beneficiario Coincidente</h3>
            <p style={styles.resultText}>
              <b>ID:</b> {matchedBeneficiary.ID_BENEFICIARIO}
            </p>
            <p style={styles.resultText}>
              <b>NO_NOMINA:</b> {matchedBeneficiary.NO_NOMINA}
            </p>
            <p style={styles.resultText}>
              <b>Nombre:</b> {matchedBeneficiary.NOMBRE}{" "}
              {matchedBeneficiary.A_PATERNO} {matchedBeneficiary.A_MATERNO}
            </p>
          </div>
        )}

        <div style={styles.videoCanvasContainer}>
          <video ref={videoRef} style={styles.video} muted />
          <canvas ref={canvasRef} style={styles.canvas} />
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={capturePhoto} style={styles.button}>
            Capturar Foto
          </button>
          <button onClick={handleVerify} style={{ ...styles.button, marginLeft: 10 }}>
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    textAlign: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  subtitle: {
    color: "#444",
    marginBottom: 20,
    fontSize: "1.5rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px 30px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  statusMessage: {
    margin: "10px 0",
    padding: "10px",
    backgroundColor: "#EFEFEF",
    borderRadius: "4px",
    color: "#333",
    fontWeight: "bold",
  },
  resultBox: {
    textAlign: "left",
    margin: "20px 0",
    padding: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "5px",
    background: "#fafafa",
  },
  resultTitle: {
    fontSize: "1.1rem",
    marginBottom: "10px",
    color: "#333",
  },
  resultText: {
    margin: "5px 0",
  },
  videoCanvasContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: 20,
    flexWrap: "wrap",
  },
  video: {
    width: 320,
    height: 240,
    background: "#000",
    borderRadius: "6px",
  },
  canvas: {
    width: 320,
    height: 240,
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#0070f3",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
    transition: "background 0.3s",
  },
};
