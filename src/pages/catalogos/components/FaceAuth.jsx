/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useState, useEffect } from "react";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";
import * as faceapi from "face-api.js";
import styles from "../../css/FaceTestPage.module.css";
import Image from "next/image";

export default function FaceAuth({ beneficiaries }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const successSound = "/assets/applepay.mp3"; // Ruta desde la carpeta public
const errorSound = "/assets/error.mp3";

const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

  // Beneficiario reconocido
  const [recognizedBeneficiary, setRecognizedBeneficiary] = useState(null);

  const { modelsLoaded, getDescriptorFromCanvas } = useFaceRecognition();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (error) {
        console.error("No se pudo acceder a la cámaraa:", error);
        setMessage("Permiso de cámara denegado o no disponible.");
        setCameraActive(false);
      }
    };
    startCamera();

    // Apagar cámara al desmontar
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capturar foto
  const capturePhoto = () => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) {
      setMessage("No se puede capturar foto: cámara inactiva.");
      return false;
    }
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1500);

    setMessage("Foto capturada.");
    return true;
  };

  // Verificar rostro
  const verifyPhoto = async () => {
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

    setMessage("Comparando rostro...");
    const descriptorCaptured = await getDescriptorFromCanvas(canvasRef.current);

    if (!descriptorCaptured) {
      playSound(false);
      setMessage("No se detectó un rostro en la foto tomada.");
      return;
    }

    let bestMatch = null;
    let minDistance = Infinity;
    const threshold = 0.6;

    for (const beneficiary of beneficiaries) {
      try {
        const jsonArray = JSON.parse(beneficiary.DESCRIPTOR_FACIAL);
        const storedDescriptor = new Float32Array(jsonArray);

        const distance = faceapi.euclideanDistance(descriptorCaptured, storedDescriptor);
        if (distance < threshold && distance < minDistance) {
          minDistance = distance;
          bestMatch = beneficiary;
        }
      } catch (err) {
        console.error("Error parseando descriptor:", err);
      }
    }

    if (bestMatch) {
      setRecognizedBeneficiary({ ...bestMatch, distance: minDistance });
      playSound(true);
      setMessage("¡Beneficiario reconocido!");
    } else {
      playSound(false);
      setRecognizedBeneficiary(null);
      setMessage("No se encontraron coincidencias.");
    }
  };

  const handleCaptureAndVerify = async () => {
    const success = capturePhoto();
    if (success) {
      setTimeout(() => {
        verifyPhoto();
      }, 500);
    }
  };

  const isExpanded = recognizedBeneficiary ? styles.expanded : "";

  return (
    <div className={styles.container}>
      <h2 className={styles.subtitle}>Verificación de Rostro</h2>

      <div className={`${styles.card} ${isExpanded}`}>
        {message && (
          <div
            className={`${styles.alert} ${
              recognizedBeneficiary ? styles.success : styles.error
            }`}
          >
            {message}
          </div>
        )}

        <div className={styles.videoCanvasContainer}>
          <div className={styles.videoWrapper}>
            <video ref={videoRef} className={styles.video} muted />
            {!recognizedBeneficiary && (
              <div className={styles.faceIconOverlay}>
                <Image src="/faceIcon.png" alt="Face Icon" className={styles.faceIconImage} width={100} height={100}/>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <button onClick={handleCaptureAndVerify} className={styles.button}>
          Capturar y Verificar
        </button>

        {recognizedBeneficiary && (
          <div className={styles.infoContainer}>
            <h3>Beneficiario Reconocido</h3>
            <p><strong>ID:</strong> {recognizedBeneficiary.ID_BENEFICIARIO}</p>
            <p><strong>No. Nómina:</strong> {recognizedBeneficiary.NO_NOMINA}</p>
            <p>
              <strong>Nombre:</strong> {recognizedBeneficiary.NOMBRE}{" "}
              {recognizedBeneficiary.A_PATERNO} {recognizedBeneficiary.A_MATERNO}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
