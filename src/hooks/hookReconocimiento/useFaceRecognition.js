// hooks/useFaceRecognition.js
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Ruta en public/models
        // Carga los modelos que necesites:
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        // Ejemplo si quieres edad/género:
        // await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        // Ejemplo si quieres expresiones:
        // await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
      } catch (error) {
        console.error("Error cargando modelos de face-api:", error);
      }
    };
    loadModels();
  }, []);

  /**
   * Obtiene el descriptor de un rostro a partir de una URL de imagen.
   * @param {string} imageUrl URL de Cloudinary u otra URL pública.
   */
  const getDescriptorFromUrl = async (imageUrl) => {
    try {
      const img = await faceapi.fetchImage(imageUrl);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) return null;
      return detection.descriptor;
    } catch (error) {
      console.error("Error al obtener descriptor desde URL:", error);
      return null;
    }
  };

  /**
   * Obtiene el descriptor de un rostro a partir de un <canvas>.
   * @param {HTMLCanvasElement} canvas - Foto capturada.
   */
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

  /**
   * Compara dos descriptores y retorna { distance, match }.
   * @param {Float32Array} descriptor1
   * @param {Float32Array} descriptor2
   * @param {number} threshold - Umbral de similitud, por defecto 0.6
   */
  const compareDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
    if (!descriptor1 || !descriptor2) {
      return { distance: null, match: false };
    }
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const match = distance < threshold;
    return { distance, match };
  };

  /**
   * Método principal para comparar la foto almacenada (URL) con la foto capturada (canvas).
   * @param {string} storedImageUrl - URL guardada en tu BD.
   * @param {HTMLCanvasElement} capturedCanvas - Canvas con la nueva foto tomada.
   * @param {number} threshold - Umbral (ej. 0.6).
   */
  const compareFaces = async (storedImageUrl, capturedCanvas, threshold = 0.6) => {
    if (!modelsLoaded) {
      console.warn("Modelos aún no cargados.");
      return { distance: null, match: false };
    }

    const descriptorStored = await getDescriptorFromUrl(storedImageUrl);
    const descriptorCaptured = await getDescriptorFromCanvas(capturedCanvas);

    return compareDescriptors(descriptorStored, descriptorCaptured, threshold);
  };

  return {
    modelsLoaded,
    compareFaces,
  };
}
