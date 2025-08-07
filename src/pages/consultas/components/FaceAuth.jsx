/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa"; //* Ícono de Spinner
import Swal from "sweetalert2";
import * as faceapi from "face-api.js";
import { useRouter } from "next/router";
import useFaceRecognition from "../../../hooks/hookReconocimiento/useFaceRecognition";
import { showCustomAlert } from "../../../utils/alertas";

export default function FaceAuth({ beneficiaries }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState(false);

  //* Manejo de estados para "escaneo" y "redirección" (cada uno mostrará un loader)
  const [loadingMessage, setLoadingMessage] = useState("");

  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  const { modelsLoaded, getDescriptorFromCanvas } = useFaceRecognition();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  //* Inicia la cámara
  const startCamera = async () => {
    try {
      //console.log("🎥 Intentando activar la cámara...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          //console.log("✅ Cámara lista, reproduciendo video...");
          await videoRef.current.play();
          setCameraActive(true);
        };
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("🚨 No se pudo acceder a la cámara:", error);
      setMessage("Permiso de cámara denegado o no disponible.");
      setCameraActive(false);
    }
  };

  //* Detiene la cámara
  const stopCamera = () => {
    //console.log("🛑 Apagando cámara...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  //* Captura la foto desde la cámara
  const capturePhoto = async () => {
    if (
      !cameraActive ||
      !canvasRef.current ||
      !videoRef.current ||
      buttonDisabled
    ) {
      setMessage(
        "No se puede capturar foto: cámara inactiva o botón deshabilitado."
      );
      return;
    }

    setButtonDisabled(true);

    const ctx = canvasRef.current.getContext("2d");
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    //* Muestra "Cargando..." mientras se realiza el escaneo
    setLoadingMessage("Escaneando rostro...");
    setTimeout(async () => {
      await handleVerify();
      setButtonDisabled(false);
      setLoadingMessage(""); //* Finaliza mensaje de carga
    }, 1500);
  };

  //* Verifica la foto contra el descriptor de cada beneficiario
  const handleVerify = async () => {
    if (!modelsLoaded) {
      setMessage("Los modelos no están listos. Espera un momento.");
      return;
    }

    setMessage("Obteniendo descriptor de la foto tomada...");
    const descriptorCaptured = await getDescriptorFromCanvas(canvasRef.current);

    if (!descriptorCaptured) {
      await showCustomAlert(
        "error",
        "Rostro No Detectado",
        "No se pudo detectar un rostro en la imagen capturada.",
        "Intentar de Nuevo"
      );

      return;
    }

    let bestMatch = null;
    let minDistance = Infinity;
    const threshold = 0.6;

    for (const beneficiary of beneficiaries) {
      try {
        if (!beneficiary.DESCRIPTOR_FACIAL) continue;

        const storedDescriptor = new Float32Array(
          JSON.parse(beneficiary.DESCRIPTOR_FACIAL)
        );
        const distance = faceapi.euclideanDistance(
          descriptorCaptured,
          storedDescriptor
        );

        if (distance < threshold && distance < minDistance) {
          minDistance = distance;
          bestMatch = beneficiary;
        }
      } catch (err) {
        console.error("Error parseando descriptor facial:", err);
      }
    }

    if (bestMatch) {
      playSound(true);

      //* Encriptar con Base64
      const encryptedNomina = btoa(bestMatch.NO_NOMINA);
      const encryptedBeneficiario = btoa(bestMatch.ID_BENEFICIARIO);

      await showCustomAlert(
        "success",
        "✅ Beneficiario Reconocido",
        `¿Eres <strong>${bestMatch.NOMBRE} ${bestMatch.A_PATERNO} ${bestMatch.A_MATERNO}</strong>?`,
        "Sí, soy yo",
        {
          showCancelButton: true,
          confirmButtonColor: "#00ff44",
          cancelButtonColor: "#ff4444",
          cancelButtonText: "No, intentar de nuevo",
          background: "linear-gradient(145deg, #002a00, #001500)",
          customClass: {
            popup:
              "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,255,68,0.9)] rounded-lg",
          },
        }
      ).then((result) => {
        if (result.isConfirmed) {
          //* Muestra loader al redirigir
          setLoadingMessage("Redirigiendo...");
          stopCamera();
          //* Redirigir con parámetros encriptados
          router.push(
            `/consultas/signos-vitales-facial?nomina=${encryptedNomina}&idBeneficiario=${encryptedBeneficiario}`
          );
        } else {
          //console.log("🔄 Escaneando nuevamente...");
          capturePhoto();
        }
      });
    } else {
      await showCustomAlert(
        "warning",
        "No se encontró coincidencia",
        "No se detectó una coincidencia con los beneficiarios registrados. Intenta de nuevo.",
        "Intentar de Nuevo",
        {
          showCancelButton: true,
          confirmButtonColor: "#ff9800",
          cancelButtonColor: "#ff4444",
          cancelButtonText: "Cancelar",
        }
      ).then((result) => {
        if (result.isConfirmed) {
          capturePhoto();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          router.push("/consultas/signos-vitales");
        }
      });
    }
  };

  return (
    <>
      {/* FONDO ANIMADO + CONTENEDOR PRINCIPAL */}
      <div className="relative min-h-screen bg-gradient-to-tr from-purple-900 via-black to-blue-900 text-white py-16 px-8 overflow-hidden flex items-center justify-center">
        {/* Figuras decorativas animadas */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="w-[70vw] h-[70vw] bg-purple-700 opacity-20 rounded-full absolute top-[-35vw] left-[-35vw] blur-3xl animate-pulse" />
          <div className="w-[60vw] h-[60vw] bg-blue-700 opacity-20 rounded-full absolute bottom-[-30vw] right-[-30vw] blur-2xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-3xl w-full bg-gray-800 bg-opacity-30 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold mb-6 uppercase flex items-center space-x-3">
            <FaCamera className="text-yellow-300" />
            <span>Verificación de Rostro</span>
          </h2>

          {/* Video y Canvas */}
          <div className="relative w-full max-w-xl mb-6 flex flex-col items-center">
            <video
              ref={videoRef}
              className="w-full h-auto rounded-md border-2 border-blue-500 shadow-md"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-md font-bold text-lg flex items-center space-x-2 transition duration-300 disabled:opacity-50"
            disabled={buttonDisabled}
          >
            <FaCamera />
            <span>Capturar y Verificar</span>
          </button>

          {/* Mensaje o debug */}
          {message && (
            <p className="mt-4 text-sm text-yellow-300 italic">{message}</p>
          )}
        </div>
      </div>

      {/* OVERLAY DE CARGA */}
      {loadingMessage && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">{loadingMessage}</p>
        </div>
      )}
    </>
  );
}
