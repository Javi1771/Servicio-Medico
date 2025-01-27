import { useState, useEffect } from "react";
import * as faceapi from 'face-api.js';

export default function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; //* asumiendo que los tienes en /public/models
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error cargando modeloss de face-api:", error);
      }
    };
    loadModels();
  }, []);

  //* Obtener descriptor desde un <canvas> con una sola cara
  const getDescriptorFromCanvas = async (canvas) => {
    try {
      const detection = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) return null;
      return detection.descriptor;
    } catch (error) {
      console.error("Error al obtener descriptor desde Canvas:", error);
      return null;
    }
  };

  return {
    modelsLoaded,
    getDescriptorFromCanvas,
  };
}
