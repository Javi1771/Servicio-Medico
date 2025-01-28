/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
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
        html: `<p style='color: #4CAF50; font-size: 1.2rem;'><b>ID:</b> ${bestMatch.ID_BENEFICIARIO}</p>
               <p style='color: #4CAF50; font-size: 1.2rem;'><b>No. Nómina:</b> ${bestMatch.NO_NOMINA}</p>
               <p style='color: #4CAF50; font-size: 1.2rem;'><b>Nombre:</b> ${bestMatch.NOMBRE} ${bestMatch.A_PATERNO} ${bestMatch.A_MATERNO}</p>`,
        icon: "success",
        timer: 3000,
        background: "linear-gradient(90deg, #1E90FF, #87CEEB)",
        confirmButtonColor: "#4CAF50",
      });
    } else {
      playSound(false);
      Swal.fire({
        title: "No se encontraron coincidencias",
        text: "Intenta nuevamente.",
        icon: "error",
        timer: 3000,
        background: "linear-gradient(90deg, #FF6347, #FF4500)",
        confirmButtonColor: "#FF4500",
      });
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        background: "radial-gradient(circle, rgba(34,193,195,1) 0%, rgba(45,253,83,1) 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Roboto', sans-serif",
        color: "#FFFFFF",
        animation: "pulse 10s infinite",
      }}
    >
      <h2
        className={styles.subtitle}
        style={{
          fontSize: "4rem",
          fontWeight: "bold",
          textShadow: "0px 0px 20px rgba(255,255,255,0.8)",
        }}
      >
        Verificación Facial
      </h2>
      <div
        className={styles.card}
        style={{
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0px 4px 30px rgba(0,0,0,0.5)",
          background: "rgba(0, 0, 0, 0.6)",
        }}
      >
        {message && (
          <div
            className={styles.alert}
            style={{
              fontSize: "1.5rem",
              textAlign: "center",
              marginBottom: "1rem",
              color: "#FFD700",
              textShadow: "0px 0px 10px rgba(255,215,0,1)",
            }}
          >
            {message}
          </div>
        )}
        <div
          className={styles.videoCanvasContainer}
          style={{ position: "relative", marginBottom: "1.5rem" }}
        >
          <video
            ref={videoRef}
            className={styles.video}
            style={{
              borderRadius: "20px",
              border: "2px solid #00FF7F",
              boxShadow: "0px 0px 15px #00FF7F",
            }}
            muted
          />
          {isScanning && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                animation: "scan 2s infinite",
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.1) 10%, rgba(0,0,0,0.8) 90%)",
              }}
            ></div>
          )}
        </div>
        <button
          onClick={capturePhoto}
          className={styles.button}
          style={{
            background: "linear-gradient(to right, #00c6ff, #0072ff)",
            color: "#FFFFFF",
            padding: "1rem 3rem",
            fontSize: "1.5rem",
            borderRadius: "30px",
            cursor: buttonDisabled ? "not-allowed" : "pointer",
            boxShadow: "0px 0px 20px rgba(0,123,255,0.8)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.boxShadow = "0px 0px 30px rgba(0,123,255,1)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0px 0px 20px rgba(0,123,255,0.8)";
          }}
          disabled={buttonDisabled}
        >
          <FaCamera /> Capturar y Verificar
        </button>
      </div>
    </div>
  );
}
