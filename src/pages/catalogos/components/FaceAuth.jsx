import { useRef, useState, useEffect } from "react";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";
import * as faceapi from "face-api.js";
import Swal from "sweetalert2";
import styles from "../../css/FaceTestPage.module.css";

export default function FaceAuth({ beneficiaries }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const { modelsLoaded, getDescriptorFromCanvas } = useFaceRecognition();

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

    // Iniciar animación de escáner
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1500); // Duración del escaneo

    setMessage("Foto capturada.");
  };

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

    setMessage("Obteniendo descriptor de la foto tomada...");
    const descriptorCaptured = await getDescriptorFromCanvas(canvasRef.current);

    if (!descriptorCaptured) {
      setMessage("No se detectó un rostro en la foto tomada.");
      return;
    }

    setMessage("Comparando descriptores...");
    let bestMatch = null;
    let minDistance = Infinity;
    const threshold = 0.6;

    for (const beneficiary of beneficiaries) {
      const jsonArray = JSON.parse(beneficiary.DESCRIPTOR_FACIAL);
      const storedDescriptor = new Float32Array(jsonArray);
      const distance = faceapi.euclideanDistance(descriptorCaptured, storedDescriptor);

      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        bestMatch = beneficiary;
      }
    }

    if (bestMatch) {
      Swal.fire({
        title: "¡Beneficiario Encontrado!",
        html: `
          <p><b>ID:</b> ${bestMatch.ID_BENEFICIARIO}</p>
          <p><b>NO_NOMINA:</b> ${bestMatch.NO_NOMINA}</p>
          <p><b>Nombre:</b> ${bestMatch.NOMBRE} ${bestMatch.A_PATERNO} ${bestMatch.A_MATERNO}</p>
        `,
        icon: "success",
        showClass: {
          popup: "swal2-show",
        },
        hideClass: {
          popup: "swal2-hide",
        },
        timer: 3000,
      });
    } else {
      Swal.fire({
        title: "No se encontraron coincidencias",
        text: "Intenta nuevamente.",
        icon: "error",
        showClass: {
          popup: "swal2-show",
        },
        hideClass: {
          popup: "swal2-hide",
        },
        timer: 3000,
      });
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.subtitle}>Verificación de Rostro</h2>

      <div className={styles.card}>
        {message && <p className={styles.statusMessage}>{message}</p>}

        <div className={styles.videoCanvasContainer}>
          <div className={`${styles.scannerFrame} ${isScanning ? styles.scannerActive : ""}`}>
            <video ref={videoRef} className={styles.video} muted />
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={capturePhoto} className={styles.button}>
            Capturar Foto
          </button>
          <button onClick={handleVerify} className={`${styles.button}`} style={{ marginLeft: "10px" }}>
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
}
