/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { IoInformationCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import * as faceapi from "face-api.js";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";
import styles from "../../css/FaceTestPage.module.css";

export default function FaceAuth({ beneficiaries }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const { modelsLoaded, getDescriptorFromCanvas } = useFaceRecognition();

  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

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

  const capturePhoto = async () => {
    if (!cameraActive || !canvasRef.current || !videoRef.current || buttonDisabled) {
      setMessage("No se puede capturar foto: cámara inactiva o botón deshabilitado.");
      return;
    }

    setButtonDisabled(true);

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    const ctx = canvasRef.current.getContext("2d");

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    setIsScanning(true);

    setTimeout(async () => {
      await handleVerify();
      setButtonDisabled(false);
    }, 1500);

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
      playSound(false);
      setMessage("No se detectó un rostro en la foto tomada.");
      return;
    }

    setMessage("Comparando descriptores...");
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
      playSound(true);
      Swal.fire({
        title: "¡Beneficiario Encontrado!",
        html: `<p><b>ID:</b> ${bestMatch.ID_BENEFICIARIO}</p>
               <p><b>No. Nómina:</b> ${bestMatch.NO_NOMINA}</p>
               <p><b>Nombre:</b> ${bestMatch.NOMBRE} ${bestMatch.A_PATERNO} ${bestMatch.A_MATERNO}</p>`,
        icon: "success",
        timer: 3000,
      });
    } else {
      playSound(false);
      Swal.fire({
        title: "No se encontraron coincidencias",
        text: "Intenta nuevamente.",
        icon: "error",
        timer: 3000,
      });
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.subtitle}>Verificación de Rostro</h2>
      <div className={styles.card}>
        {message && (
          <div className={styles.alert}>{message}</div>
        )}
        <div className={styles.videoCanvasContainer}>
          <div className={styles.videoWrapper}>
            <video ref={videoRef} className={styles.video} muted />
            {isScanning && (
              <div className={styles.scanLine} />
            )}
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <button onClick={capturePhoto} className={styles.button} disabled={buttonDisabled}>
          <FaCamera /> Capturar y Verificar
        </button>
      </div>
    </div>
  );
}
