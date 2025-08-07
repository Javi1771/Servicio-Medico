/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import Modal from "react-modal";
import styles from "../css/beneficiarios.module.css";
import { useRouter } from "next/router";
import { jsPDF } from "jspdf";
import { FaCamera } from "react-icons/fa";
import * as faceapi from "face-api.js";
import SignatureCanvas from "react-signature-canvas";

import {
  FaIdCard,
  FaPrint,
  FaTimes,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";

import {
  FaCalendarAlt,
  FaPhone,
  FaFileUpload,
  FaFileAlt,
  FaDisease,
  FaSave,
  FaUsers,
  FaVenusMars,
} from "react-icons/fa";
import { showCustomAlert } from "../../utils/alertas";

Modal.setAppElement("#__next"); // Configuración del modal en Next.js

export default function RegistroBeneficiario() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numNomina, setNumNomina] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [parentescoOptions, setParentescoOptions] = useState([]);
  const [sexoOptions, setSexoOptions] = useState([]);
  const [formData, setFormData] = useState({
    parentesco: "",
    nombre: "",
    aPaterno: "",
    aMaterno: "",
    sexo: "",
    fNacimiento: "",
    escolaridad: "",
    activo: "A",
    alergias: "",
    sangre: "",
    telEmergencia: "",
    nombreEmergencia: "",
    esEstudiante: 0,
    esDiscapacitado: 0,
    vigenciaEstudios: "",
    imageUrl: "",
    curp: "",
    urlConstancia: "",
    urlCurp: "",
    urlActaNac: "",
    actaMatrimonioUrl: "",
    ineUrl: "",
    cartaNoAfiliacionUrl: "",
    actaConcubinatoUrl: "",
    actaDependenciaEconomicaUrl: "",
    descriptorFacial: "",
    firma: "",
  });

  const [beneficiaryIdToDelete, setBeneficiaryIdToDelete] = useState(null);

  const isPadreOMadre =
    Number(formData.parentesco) === 4 || Number(formData.parentesco) === 5;

  const showCheckboxes =
    (formData.parentesco === "2" || formData.parentesco === 2) &&
    formData.edad >= 16;

  // Para manejar el recuadro de la firma
  const [isFirmaOpen, setIsFirmaOpen] = useState(false);
  const signatureRef = useRef(null);

  // Al hacer clic en el botón “Firma”
  const handleOpenFirma = () => {
    setIsFirmaOpen(true);
    // Espera a que se renderice el modal y el canvas esté disponible
    setTimeout(() => {
      if (isEditMode && formData.firma && signatureRef.current) {
        signatureRef.current.fromDataURL(formData.firma);
      }
    }, 100);
  };

  // Al pulsar “Guardar Firma” en el modal de la firma
  const handleSaveFirma = async () => {
    if (!signatureRef.current) return;

    const firmaBase64 = signatureRef.current.getCanvas().toDataURL("image/png");

    setFormData((prev) => ({
      ...prev,
      firma: firmaBase64,
    }));

    setIsFirmaOpen(false);
    await showCustomAlert(
      "success",
      "Firmado",
      "La firma se guardó correctamente.",
      "Aceptar"
    );
  };

  // Al pulsar “Limpiar”
  const handleClearFirma = () => {
    if (!signatureRef.current) return;
    signatureRef.current.clear();
    // Actualiza el estado para que la firma se considere borrada
    setFormData((prev) => ({ ...prev, firma: "" }));
  };

  useEffect(() => {
    if (isFirmaOpen && formData.firma && signatureRef.current) {
      signatureRef.current.fromDataURL(formData.firma);
    }
  }, [isFirmaOpen, formData.firma]);

  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBeneficiaryId, setCurrentBeneficiaryId] = useState(null);
  const router = useRouter(); // Define el router usando useRouter
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Estado para deshabilitar el botón de guardar
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading] = useState(false);

  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleCloseModal = () => {
    setIsFadingOut(true); // Activamos la animación de salida
    setTimeout(() => {
      setIsFadingOut(false); // Reseteamos el estado después del fadeOut
      setIsDocumentsModalOpen(false); // Cerramos el modal
    }, 300); // La duración del fadeOut debe coincidir con la animación CSS
  };

  // Función para calcular edad desde una fecha
  function calculateAge(date) {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Función para convertir "Lunes, 17/06/2024, 10:23 a.m." a una fecha válida
  function convertToDate(fechaConDiaSemana) {
    const fechaStr = fechaConDiaSemana.split(",")[1].trim(); // "17/06/2024"
    const [dia, mes, año] = fechaStr.split("/"); // ["17", "06", "2024"]
    return new Date(`${año}-${mes}-${dia}`); // "2024-06-17"
  }

  /**const de modelo facial */
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    // Cargamos los modelos de face-api al montar el componente (sólo se hace 1 vez)
    async function loadFaceApiModels() {
      try {
        const MODEL_URL = "/models"; // Asegúrate de tenerlos en /public/models
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        //console.log("[face-api] Modelos cargados correctamente en el front");
      } catch (err) {
        console.error("[face-api] Error al cargar modelos:", err);
      }
    }
    loadFaceApiModels();
  }, []);

  // Función para convertir una imagen base64 a un descriptor *************************************************
  async function computeDescriptorFromBase64(base64Image) {
    try {
      if (!modelsLoaded) {
        console.warn("Modelos face-api no están listos todavía");
        return null;
      }
      // Creamos un objeto <img> a partir de la base64
      const img = await faceapi.fetchImage(base64Image);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection ? detection.descriptor : null;
    } catch (error) {
      console.error("[computeDescriptorFromBase64] Error:", error);
      return null;
    }
  }
  /*********************************** */

  const calcularVigencia = (
    parentesco,
    edad,
    vigenciaEstudios,
    fechaNacimiento,
    esDiscapacitado
  ) => {
    if (parentesco === 2) {
      // Hijo(a)
      if (esDiscapacitado) {
        return "30/09/2027"; // Vigencia fija para hijos discapacitados
      } else if (edad < 16) {
        const fechaCumple16 = calculateTimeUntil16(fechaNacimiento);
        return fechaCumple16
          ? fechaCumple16.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "Sin vigencia definida";
      } else {
        return vigenciaEstudios
          ? formatFecha(vigenciaEstudios) // Asegúrate de formatear la fecha de vigencia de estudios
          : "Sin vigencia definida";
      }
    } else {
      return "30/09/2027"; // Otros parentescos
    }
  };

  const handleFileUploadActaConcubinatoManual = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos un FormData con la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // ID del parentesco ("1", "2", etc.)
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch(
        "/api/beneficiarios/uploadActaConcubinatoManual",
        {
          method: "POST",
          body: formDataData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        //console.log(
        //   "Acta de Concubinato Manual subida exitosamente:",
        //   data.url
        // );
        setFormData((prev) => ({
          ...prev,
          actaConcubinatoUrl: data.url, // Guardar la URL del archivo
        }));
        await showCustomAlert(
          "success",
          "Éxito",
          "Acta de Concubinato Manual subida correctamente.",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir el Acta de Concubinato Manual. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Concubinato Manual:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el Acta de Concubinato Manual.",
        "Aceptar"
      );
    }
  };

  /********************************************************************* */

  const handleFileUploadActaMatrimonioManual = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos FormData con la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Ej: "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch(
        "/api/beneficiarios/uploadActaMatrimonioManual",
        {
          method: "POST",
          body: formDataData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        //console.log("Acta de Matrimonio subida manualmente:", data.url);
        setFormData((prev) => ({
          ...prev,
          actaMatrimonioUrl: data.url, // Guardar la URL del Acta de Matrimonio
        }));
        await showCustomAlert(
          "success",
          "Éxito",
          "Acta de Matrimonio subida manualmente con éxito.",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir el Acta de Matrimonio manual.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Matrimonio manual:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el Acta de Matrimonio manual.",
        "Aceptar"
      );
    }
  };

  /********************************************************************* */

  const handleFileUploadIncap = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos un FormData y agregamos toda la información requerida
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Ej.: "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadIncap", {
        method: "POST",
        body: formDataData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          urlIncap: data.url, // Guardar la URL en el estado
        }));
        await showCustomAlert(
          "success",
          "Éxito",
          "Acta de Incapacidad subida correctamente.",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "error",
          "Error al subir el Acta de Incapacidad",
          "Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Incapacidad:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el Acta de Incapacidad.",
        "Aceptar"
      );
    }
  };

  /**VALIDACION SI EL BENEFICIARIO NO ES MAYOR A 16 ANOS */
  const calculateTimeUntil16 = (birthDate) => {
    if (!birthDate) return null;

    const birthDateObject = new Date(birthDate);
    birthDateObject.setUTCHours(12, 0, 0, 0); // Asegurar que la fecha se mantenga fija

    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    // Calcular la fecha en que cumple 16 años
    const sixteenYearsDate = new Date(
      birthDateObject.getFullYear() + 16,
      birthDateObject.getMonth(),
      birthDateObject.getDate()
    );
    sixteenYearsDate.setUTCHours(12, 0, 0, 0); // Ajustar horas para evitar desplazamientos

    // Si ya tiene 16 años, no hay tiempo restante
    if (sixteenYearsDate <= today) {
      return null;
    }

    return sixteenYearsDate; // Devuelve la fecha en que cumple 16 años
  };

  const handleCapturePhoto = async () => {
    try {
      let isVideoReady = false;

      playSound(true);
      const result = await Swal.fire({
        title: "Captura una foto",
        html: '<video id="video" autoplay></video>',
        showCancelButton: true,
        confirmButtonText: "Capturar",

        // Se ejecuta justo antes de que aparezca la alerta
        willOpen: () => {
          const video = document.getElementById("video");
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              video.srcObject = stream;
              window.localStream = stream;
              video.addEventListener("loadedmetadata", () => {
                isVideoReady = true;
              });
            })
            .catch((error) => {
              console.error("Error al acceder a la cámara:", error);
              // Evita que SweetAlert se cierre si la cámara falla
              Swal.showValidationMessage("No se pudo acceder a la cámara.");
            });
        },

        // Se ejecuta cuando el usuario hace clic en "Capturar"
        preConfirm: () => {
          if (!isVideoReady) {
            // Evita que SweetAlert se cierre si la cámara no está lista
            playSound(false);
            Swal.showValidationMessage(
              "La cámara no está lista. Intenta de nuevo."
            );
            return false;
          }

          // Capturamos la imagen del <video> en un <canvas>
          const video = document.getElementById("video");
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convertimos el contenido del canvas a base64
          const base64Image = canvas.toDataURL("image/jpeg");

          // Detenemos la cámara aquí (después de capturar)
          if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
          }

          // Retornamos la imagen base64 para que SweetAlert la reciba en `result.value`
          return base64Image;
        },

        // Ya no detenemos la cámara en willClose porque la detenemos en preConfirm
        willClose: () => {
          // vacío
        },
      });

      // Revisa si el usuario confirmó (isConfirmed) y si result.value trae la imagen base64
      if (result.isConfirmed && result.value) {
        const base64Image = result.value;
        // 1. Muestra la previsualización
        setImagePreview(base64Image);

        // 2. (Opcional) Detectar rostro con face-api
        const descriptor = await computeDescriptorFromBase64(base64Image);
        if (!descriptor) {
          await showCustomAlert(
            "error",
            "Error",
            "No se detectó un rostro en la imagen.",
            "Aceptar"
          );

          return;
        }
        const descriptorArray = Array.from(descriptor);
        const descriptorJSON = JSON.stringify(descriptorArray);
        setFormData((prev) => ({
          ...prev,
          descriptorFacial: descriptorJSON,
        }));
        //console.log("Descriptor facial calculado:", descriptorJSON);

        // 3. Subir la imagen a tu servidor
        await uploadImage(base64Image);
      }
    } catch (error) {
      console.error("Error al capturar/subir la foto:", error);
      await showCustomAlert(
        "error",
        "Error",
        "Error al capturar o subir la foto.",
        "Aceptar"
      );
    }
  };

  const uploadImage = async (base64Image) => {
    if (!numNomina) {
      await showCustomAlert(
        "warning",
        "Error",
        "Por favor, ingresa el número de nómina.",
        "Aceptar"
      );

      return;
    }

    try {
      // Enviamos además los campos necesarios para construir la ruta:
      // parentesco, nombre, aPaterno y aMaterno.
      const response = await fetch("/api/beneficiarios/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          numNomina,
          parentesco: formData.parentesco,
          nombre: formData.nombre,
          aPaterno: formData.aPaterno,
          aMaterno: formData.aMaterno,
        }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        await showCustomAlert(
          "success",
          "Éxito",
          "Imagen subida correctamente.",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "error",
          "Error",
          data.error || "No se pudo subir la imagen.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      await showCustomAlert(
        "error",
        "Error",
        "Error al subir la imagen.",
        "Aceptar"
      );
    }
  };

  const getFileNameFromURL = (url) => {
    if (!url) return "Sin archivo";
    const segments = url.split("/");
    return segments[segments.length - 1]; // Obtener el nombre al final de la URL
  };

  const handleFileUploadINE = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos FormData con toda la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Por ejemplo, "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadINE", {
        method: "POST",
        body: formDataData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          ineUrl: data.url, //* Guardar la URL del INE en el estado
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir el INE. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el INE:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el INE.",
        "Aceptar"
      );
    }
  };

  const handleFileUploadCartaNoAfiliacion = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos un objeto FormData y agregamos toda la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Ej: "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch(
        "/api/beneficiarios/uploadCartaNoAfiliacion",
        {
          method: "POST",
          body: formDataData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          cartaNoAfiliacionUrl: data.url, // Guardar la URL correcta
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir la Carta de No Afiliación. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir la Carta de No Afiliación:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir la Carta de No Afiliación.",
        "Aceptar"
      );
    }
  };

  const handleFileUploadCurp = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos un FormData y agregamos la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Ejemplo: "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadCurp", {
        method: "POST",
        body: formDataData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          urlCurp: data.url, //* Guardar la URL resultante en el estado
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir la CURP. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir la CURP:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir la CURP.",
        "Aceptar"
      );
    }
  };

  // handleFileUploadActa
  const handleFileUploadActa = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos formData con toda la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadActa", {
        method: "POST",
        body: formDataData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          urlActaNac: data.url, //* Guardar la URL del Acta de Nacimiento
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir el Acta de Nacimiento. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Nacimiento:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el Acta de Nacimiento.",
        "Aceptar"
      );
    }
  };

  const handleFileUploadActaEconomica = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco);
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadActaEconomica", {
        method: "POST",
        body: formDataData,
      });
      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          actaDependenciaEconomicaUrl: data.url,
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error al subir el Acta de Dependencia Económica",
          "Error al subir el Acta de Dependencia Económica. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Dependencia Económica:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir el Acta de Dependencia Económica.",
        "Aceptar"
      );
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creamos un FormData y agregamos la información necesaria
    const formDataData = new FormData();
    formDataData.append("file", file);
    formDataData.append("numNomina", numNomina);
    formDataData.append("parentesco", formData.parentesco); // Ej.: "1", "2", etc.
    formDataData.append("nombre", formData.nombre);
    formDataData.append("aPaterno", formData.aPaterno);
    formDataData.append("aMaterno", formData.aMaterno);

    try {
      const response = await fetch("/api/beneficiarios/uploadConstancia", {
        method: "POST",
        body: formDataData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          urlConstancia: data.url,
          fileName: file.name,
        }));
      } else {
        await showCustomAlert(
          "error",
          "Error",
          "Error al subir la Constancia de Estudios. Intenta nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al subir la Constancia de Estudios:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo subir la Constancia de Estudios.",
        "Aceptar"
      );
    }
  };

  const handleVigenciaChange = (e) => {
    const { value } = e.target;

    // SI quieres mantener alguna lógica extra cuando es estudiante, por ejemplo:
    if (formData.esEstudiante) {
      // Aquí podrías hacer efectos secundarios o cortes adicionales,
      // pero NO bloqueamos ni mostramos mensaje de error.
    }

    setFormData((prev) => ({
      ...prev,
      vigenciaEstudios: value,
    }));
    setIsSaveDisabled(false);
  };

  // Calcula la edad basada en la fecha de nacimiento
  function calculateAge(birthDate) {
    if (!birthDate) {
      return 0; // Retornar 0 si no hay fecha de nacimiento
    }

    // Convertir birthDate a un objeto Date si no lo es
    const birthDateObject =
      birthDate instanceof Date ? birthDate : new Date(birthDate);

    // Validar que la conversión sea exitosa
    if (isNaN(birthDateObject.getTime())) {
      console.error("Fecha de nacimiento no válida:", birthDate);
      return 0; // Retornar 0 si la fecha no es válida
    }

    const today = new Date();
    let age = today.getFullYear() - birthDateObject.getFullYear();
    const monthDiff = today.getMonth() - birthDateObject.getMonth();

    // Ajustar si el mes o día actual es antes que el mes/día de nacimiento
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObject.getDate())
    ) {
      age--;
    }
    return age;
  }

  // Función para formatear fechas al estilo "DD/MM/YYYY"
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleGenerateCard = async (beneficiary) => {
    if (beneficiary.ACTIVO !== "A") {
      await showCustomAlert(
        "error",
        "Error",
        "El beneficiario no está activo.",
        "Aceptar"
      );

      return;
    }

    const {
      NO_NOMINA,
      PARENTESCO,
      NOMBRE,
      A_PATERNO,
      A_MATERNO,
      F_NACIMIENTO,
      VIGENCIA_ESTUDIOS,
      ESDISCAPACITADO, // Nuevo campo para verificar discapacidad
    } = beneficiary;

    // console.log("Datos recibidos del beneficiario:", {
    //   NO_NOMINA,
    //   PARENTESCO,
    //   NOMBRE,
    //   A_PATERNO,
    //   A_MATERNO,
    //   F_NACIMIENTO,
    //   VIGENCIA_ESTUDIOS,
    //   ESDISCAPACITADO,
    // });

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edad = calculateAge(F_NACIMIENTO); // Calcular la edad
    //console.log("Edad calculada:", edad);

    const edadConAnios = `${edad} años`; // Texto para la edad

    // Calcular vigencia
    const vigencia = calcularVigencia(
      PARENTESCO,
      edad,
      VIGENCIA_ESTUDIOS,
      F_NACIMIENTO,
      ESDISCAPACITADO
    );
    //console.log("Parámetros para calcularVigencia:", {
    //   parentesco: PARENTESCO,
    //   edad,
    //   vigenciaEstudios: VIGENCIA_ESTUDIOS,
    //   fechaNacimiento: F_NACIMIENTO,
    //   ESDISCAPACITADO,
    // });
    // console.log("Vigencia final:", vigencia);

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });

      if (!response.ok) throw new Error("Empleado no encontrado");

      const employeeData = await response.json();
      //console.log("Datos del empleado obtenidos:", employeeData);

      const EMPLEADO_NOMBRE = employeeData?.nombre
        ? `${employeeData.nombre} ${employeeData.a_paterno || ""} ${
            employeeData.a_materno || ""
          }`.trim()
        : "N/A";
      const NUM_NOMINA = employeeData?.num_nom || "N/A";
      const DEPARTAMENTO = employeeData?.departamento || "N/A";

      //console.log("Datos del empleado para carnet:", {
      //   EMPLEADO_NOMBRE,
      //   NUM_NOMINA,
      //   DEPARTAMENTO,
      // });

      // Configuración de jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: "a4",
      });

      // Cargar imágenes
      const frontTemplate = await loadImageBase64(`/CARNET_FRONTAL.png`);
      const backTemplate = await loadImageBase64(`/CARNET_FRONTAL2.png`);
      const signatureImage = await loadImageBase64(`/firma.png`); // Firma del secretario

      // Página Frontal
      doc.addImage(frontTemplate, "PNG", 0, 0, 29.7, 21);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#19456a");

      doc.setFontSize(14);
      doc.text(
        `${NOMBRE || ""} ${A_PATERNO || ""} ${A_MATERNO || ""}`,
        15.7,
        6.4
      ); // Nombre
      doc.text(parentescoDescripcion, 17, 7.9); // Parentesco
      doc.text(edadConAnios, 24, 7.9); // Edad
      doc.text(vigencia, 17, 9.7); // Vigencia

      doc.setFontSize(12);
      doc.text(EMPLEADO_NOMBRE, 15.7, 11.4); // Nombre del empleado
      doc.setFontSize(12);
      doc.text(NUM_NOMINA, 17, 13.1); // Número de nómina
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 15);
      doc.text(departamentoText, 17, 14.7); // Departamento

      // Aquí añadimos la firma en la sección "Secretario de Administración" **en la primera página**.
      // Ajusta la posición (x, y) y tamaño (width, height) según tu diseño.
      doc.addImage(signatureImage, "PNG", 20, 18, 4.5, 1.5);

      // Página Trasera
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);

      // Guardar el PDF
      doc.save(`Carnet_${NOMBRE}_${A_PATERNO}.pdf`);
      //console.log("Carnet generado exitosamente");
    } catch (error) {
      console.error("Error al generar el carnet:", error.message);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo generar el carnet. Intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  const handlePrintCredential = async (beneficiary) => {
    try {
      if (beneficiary.ACTIVO !== "A") {
        await showCustomAlert(
          "error",
          "Error",
          "El beneficiario no está activo.",
          "Aceptar"
        );

        return;
      }

      const {
        NO_NOMINA,
        PARENTESCO,
        NOMBRE,
        A_PATERNO,
        A_MATERNO,
        F_NACIMIENTO,
        VIGENCIA_ESTUDIOS,
        TEL_EMERGENCIA,
        NOMBRE_EMERGENCIA,
        FOTO_URL,
        SANGRE,
        ALERGIAS,
        ESDISCAPACITADO,
        FIRMA: firma,
      } = beneficiary;

      const getParentescoDescripcion = (id) => {
        const p = parentescoOptions.find((o) => o.ID_PARENTESCO === id);
        return p ? p.PARENTESCO : "Desconocido";
      };
      const formatFechaLocal = (f) => {
        if (!f) return "";
        const [y, m, d] = f.split("T")[0].split("-");
        return `${d}/${m}/${y}`;
      };
      const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
      const edad = calculateAge(F_NACIMIENTO);
      const vigencia = calcularVigencia(
        PARENTESCO,
        edad,
        VIGENCIA_ESTUDIOS,
        F_NACIMIENTO,
        ESDISCAPACITADO
      );

      //* Obtener departamento
      const resp = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });
      if (!resp.ok) throw new Error("Empleado no encontrado");
      const emp = await resp.json();
      const DEPARTAMENTO = emp?.departamento || "N/A";

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: [8.5, 5.5],
      });

      const frontTemplate = await loadImageBase64("/CREDENCIAL_FRONTAL2.png");
      const backTemplate = await loadImageBase64("/CREDENCIAL_TRASERA.png");
      const signatureSec = await loadImageBase64("/firma.png");

      //* --- Portada ---
      doc.addImage(frontTemplate, "PNG", 0, 0, 8.5, 5.5);

      //* Escalado A4 → 8.5×5.5
      const sx = 8.5 / 29.7,
        sy = 5.5 / 21;
      const _text = doc.text.bind(doc);
      doc.text = (t, x, y, o) => _text(t, x * sx, y * sy, o);
      const _img = doc.addImage.bind(doc);
      doc.addImage = (i, f, x, y, w, h, a, c, r) =>
        _img(i, f, x * sx, y * sy, w * sx, h * sy, a, c, r);

      //* Función para texto invertido con espaciado ajustable
      function drawInvertedText(text, x, yOrig, maxWidth, lineSpacing) {
        const lines = doc.splitTextToSize(text, maxWidth);
        const spacing =
          lineSpacing !== undefined ? lineSpacing : doc.getLineHeight();
        for (let i = 0; i < lines.length; i++) {
          const y = yOrig - (lines.length - 1 - i) * spacing;
          doc.text(lines[i], x, y);
        }
      }

      //* Foto (tamaño reducido un 10%)
      if (FOTO_URL) {
        try {
          const photo = await loadImageBase64(FOTO_URL);
          //* Coordenadas originales y tamaño reducido (7.0 -> 6.3, 8.4 -> 7.56)
          const imgX = 4.5;
          const imgY = 11.5;
          const imgW = 6.8; // 7.0 * 0.9
          const imgH = 7.7; // 8.4 * 0.9

          doc.addImage(photo, "JPEG", imgX, imgY, imgW, imgH);

          doc.setLineWidth(0.25);
          doc.setDrawColor(255, 255, 255);
          doc.roundedRect(
            imgX * sx,
            imgY * sy,
            imgW * sx,
            imgH * sy,
            0.3 * sx,
            0.3 * sy,
            "S"
          );
        } catch (e) {
          console.error("Error cargando foto:", e);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor("#19456a");

      //? Nómina (7pt)
      doc.setFontSize(7);
      doc.text(NO_NOMINA.toString(), 18.3, 9.5);

      //? Parentesco (7pt)
      doc.setFontSize(7);
      doc.text(parentescoDescripcion, 19.8, 11.42);

      //? Nombre completo (5.5pt, invertido) — 2 líneas a 0.3cm: 12.9 & 13.2
      doc.setFontSize(5.5);
      const nombreFull = `${NOMBRE} ${A_PATERNO} ${A_MATERNO}`.trim();
      drawInvertedText(nombreFull, 18.4, 13.2, 3, 0.7);

      //? Edad (7pt)
      doc.setFontSize(7);
      doc.text(`${edad} años`, 17.2, 15.3);

      //? Secretaría (4.5pt, invertido) — también a 0.3cm: 17.0 & 17.3
      doc.setFontSize(4.5);
      drawInvertedText(DEPARTAMENTO, 19.2, 17.3, 3, 0.7);

      //? Vigencia (7pt)
      doc.setFontSize(7);
      doc.text(vigencia, 18.8, 19.4);

      //! --- Reverso ---
      doc.addPage();
      _img(backTemplate, "PNG", 0, 0, 8.5, 5.5);

      //? Fecha de nacimiento (6pt)
      doc.setFontSize(6);
      doc.text(formatFechaLocal(F_NACIMIENTO), 12.5, 2.8);

      //? Sangre (6pt)
      doc.text(SANGRE || "Sin información", 9.8, 5);

      //? Alergia (6pt)
      doc.text(ALERGIAS || "Sin información", 7.0, 7.4);

      //? Teléfono (6pt)
      doc.text(TEL_EMERGENCIA || "Sin información", 14, 9.8);

      //? Nombre de emergencia (6pt, invertido) — 2 líneas a 0.3cm
      doc.setFontSize(6);
      const emText = NOMBRE_EMERGENCIA || "Sin información";
      drawInvertedText(emText, 13.1, 12, 4, 0.8);

      //? Firmas
      doc.addImage(signatureSec, "PNG", 18, 13.2, 6, 2.5);
      if (firma) doc.addImage(firma, "PNG", 3.7, 13, 9, 3);

      doc.save(`Credencial_${NOMBRE}_${A_PATERNO}.pdf`);
    } catch (err) {
      console.error(err);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo generar la credencial.",
        "Aceptar"
      );
    }
  };

  // Función para cargar imágenes como base64
  const loadImageBase64 = async (src) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error al cargar la imagen base64:", error);
      throw error;
    }
  };

  // Dentro de handleInputChange para actualizar el estado cuando cambie la fecha de nacimiento
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value }; // Quita el .trim()

      // Si cambia la fecha de nacimiento, calcular edad y vigencia
      if (name === "fNacimiento") {
        const birthDate = new Date(value);
        birthDate.setUTCHours(12, 0, 0, 0); // Evitar problemas de zona horaria
        const age = calculateAge(birthDate);

        updatedData.edad = age;

        if (updatedData.parentesco === 2 && age < 16) {
          // Usar número en comparación
          const sixteenYearsDate = calculateTimeUntil16(value);
          updatedData.vigenciaEstudios = sixteenYearsDate
            ? sixteenYearsDate.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "";
        } else {
          updatedData.vigenciaEstudios = ""; // Limpiar vigencia si no aplica
        }
      }

      // Si cambia el parentesco, recalcular lógica
      if (name === "parentesco") {
        const id = Number(value);
        const isHijo = id === 2;
        const isMenor16 = prevData.edad < 16;
        const isPadreOMadre = id === 4 || id === 5;

        // 1️⃣ Guardar el parentesco como número
        updatedData.parentesco = id;

        // 2️⃣ Recalcular vigencia para Hijo(a) <16
        if (isHijo && isMenor16) {
          const sixteenYearsDate = calculateTimeUntil16(prevData.fNacimiento);
          updatedData.vigenciaEstudios = sixteenYearsDate
            ? sixteenYearsDate.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "";
        } else {
          updatedData.vigenciaEstudios = ""; // Limpia vigencia si no aplica
        }

        // 3️⃣ Limpiar documentos de Padre/Madre si cambió a otro parentesco
        if (!isPadreOMadre) {
          updatedData.actaDependenciaEconomicaUrl = "";
          updatedData.cartaNoAfiliacionUrl = "";
        }
      }

      return updatedData;
    });
  };

  const handleViewBeneficiary = async (beneficiario) => {
    setSelectedBeneficiary(null); // Limpia el estado anterior
    try {
      if (beneficiario.ACTIVO !== "A") {
        await showCustomAlert(
          "error",
          "Error",
          "El beneficiario no está activo.",
          "Aceptar"
        );

        return;
      }

      const response = await fetch(
        `/api/beneficiarios/getBeneficiary?idBeneficiario=${beneficiario.ID_BENEFICIARIO}`
      );
      const data = await response.json();

      if (response.ok) {
        setSelectedBeneficiary(data);
        setIsViewModalOpen(true);
      } else {
        console.error("Error fetching beneficiary:", data.error);
        await showCustomAlert("error", "Error", data.error, "Aceptar");
      }
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
      await showCustomAlert(
        "error",
        "Error",
        "No se pudo obtener la información del beneficiario.",
        "Aceptar"
      );
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result;

        try {
          const response = await fetch("/api/beneficiarios/uploadImage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: base64Image,
              numNomina, // Enviar la nómina
            }),
          });

          const data = await response.json();
          if (response.ok && data.imageUrl) {
            setFormData({ ...formData, imageUrl: data.imageUrl });
            await showCustomAlert(
              "success",
              "Éxito",
              "Imagen subida correctamente.",
              "Aceptar"
            );
          } else {
            await showCustomAlert(
              "error",
              "Error",
              data.error || "No se pudo subir la imagen.",
              "Aceptar"
            );
          }
        } catch (error) {
          console.error("Error al subir la imagen:", error);
          await showCustomAlert(
            "error",
            "Error",
            "Error al subir la imagen.",
            "Aceptar"
          );
        }
      };
    }
  };

  const getSindicato = (grupoNomina, cuotaSindical) => {
    if (grupoNomina === "NS") {
      return cuotaSindical === "S"
        ? "SUTSMSJR"
        : cuotaSindical === ""
        ? "SITAM"
        : null;
    }
    return null;
  };

  async function showEmployeeNotFoundAlert() {
    await showCustomAlert(
      "error",
      "Empleado No Encontrado",
      "No se ha encontrado ningún empleado con ese número de nómina.",
      "Cerrar",
    );
  }

  const handleBack = () => {
    router.replace("/inicio-servicio-medico"); // Redirige a /inicio-servicio-medico
  };

  // Función para obtener las opciones de sexo desde la API
  const fetchSexoOptions = async () => {
    try {
      const response = await fetch("/api/beneficiarios/sexo");
      const data = await response.json();
      setSexoOptions(data);
    } catch (err) {
      console.error("Error fetching sexo options:", err);
    }
  };

  // Llama a las funciones de fetch al montar el componente
  useEffect(() => {
    fetchParentescoOptions();
    fetchSexoOptions();
  }, []);

  // Memoriza fetchBeneficiarios para evitar su redefinición en cada renderizado
  const fetchBeneficiarios = useCallback(async () => {
    if (!numNomina) return;

    try {
      // Elimina esta parte si ya no necesitas llamar a esa API
      // await fetch("/api/actualizarEstadoBeneficiario", {
      //   method: "PUT",
      // });

      // Obtén los beneficiarios actualizados
      const response = await fetch(
        `/api/beneficiarios/mostBeneficiarios?num_nom=${numNomina}`
      );

      const data = await response.json();
      //console.log("Datos de beneficiarios desde la API:", data);

      // Filtrar beneficiarios localmente si es necesario
      const beneficiariosActualizados = data.map((beneficiario) => {
        // Cambiar localmente si detecta que la vigencia ha expirado
        if (
          new Date(beneficiario.VIGENCIA) < new Date() &&
          beneficiario.ACTIVO === "A"
        ) {
          return { ...beneficiario, ACTIVO: "I" }; // Cambia a inactivo
        }
        return beneficiario;
      });

      setBeneficiarios(beneficiariosActualizados);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
    }
  }, [numNomina]);

  // Ejecuta fetchBeneficiarios solo cuando el empleado cambia
  useEffect(() => {
    if (empleado) {
      fetchBeneficiarios();
    }
  }, [empleado, fetchBeneficiarios]);
  // <--- Modificado, se agrega fetchBeneficiarios como dependencia

  // Obtener opciones de parentesco
  const fetchParentescoOptions = async () => {
    try {
      const response = await fetch("/api/beneficiarios/parentescos");
      const data = await response.json();
      setParentescoOptions(data);
    } catch (err) {
      console.error("Error fetching parentesco options:", err);
    }
  };

  const handleSearch = async () => {
    if (!numNomina) {
      await showCustomAlert(
        "warning",
        "Error",
        "Por favor, ingresa el número de nómina.",
        "Aceptar"
      );

      return;
    }

    /**Obtencion de datos del empleado desde el web service */
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: numNomina }),
      });

      if (!response.ok) {
        throw new Error("Empleado no encontrado");
      }

      const data = await response.json();
      data.sindicato = getSindicato(data.grupoNomina, data.cuotaSindical); // Agrega el sindicato
      setEmpleado(data); // Guarda el empleado con sindicato en el estado
      setError(null);
    } catch (err) {
      setEmpleado(null);
      setError(err.message);
      showEmployeeNotFoundAlert();
    }
  };
  /******************* */

  const handleAddBeneficiary = async () => {
    if (!empleado) {
      await showCustomAlert(
        "warning",
        "Error",
        "Por favor, busca primero un empleado.",
        "Aceptar"
      );

      return;
    }

    // Cerrar el modal si ya estaba abierto y resetear los valores
    setIsModalOpen(false);
    setTimeout(() => {
      setFormData({
        parentesco: "",
        nombre: "",
        aPaterno: "",
        aMaterno: "",
        sexo: "",
        fNacimiento: "",
        escolaridad: "",
        activo: "A",
        alergias: "",
        sangre: "",
        telEmergencia: "",
        nombreEmergencia: "",
        esEstudiante: 0,
        esDiscapacitado: 0,
        vigenciaEstudios: "",
        imageUrl: "", // Limpia la vista previa de la imagen
        urlConstancia: "", // Limpia la constancia de estudios
        urlActanac: "", // Limpia la URL del acta de nacimiento
        urlCurp: "", // Limpia la URL del CURP
        actaMatrimonioUrl: "", // Limpia la URL del acta de matrimonio
        ineUrl: "", // Limpia la URL del INE
        cartaNoAfiliacionUrl: "", // Limpia la URL de la carta de no afiliación
        urlConcubinato: "", // Nuevo: Limpia la URL del acta de concubinato
      });

      // Establecer el modal en modo registro y abrirlo
      setIsEditMode(false);
      setIsModalOpen(true);
    }, 0); // Asegura que el estado se limpie correctamente antes de abrir
  };

  const validateUniqueParentesco = async (numNomina, parentesco) => {
    try {
      const response = await fetch(
        "/api/beneficiarios/validarParentescoUnico",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ numNomina, parentesco }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error en la validación de parentesco único"
        );
      }

      return { conflict: data.conflict, message: data.message };
    } catch (error) {
      console.error("Error al validar parentesco único:", error.message);
      throw error;
    }
  };

  function validateDocuments(formData) {
    const parentescoId = Number(formData.parentesco);

    // 1. Si es Hijo(a) (ID 2) y mayor o igual a 16 años,
    //    debe marcarse al menos "esEstudiante" o "esDiscapacitado".
    if (parentescoId === 2 && formData.edad >= 16) {
      if (!formData.esEstudiante && !formData.esDiscapacitado) {
        return {
          success: false,
          message:
            "Debes marcar 'Es estudiante' o 'Es discapacitado' para un Hijo(a) mayor de 16 años.",
        };
      }
    }
    // Si todo está correcto
    return { success: true, message: "" };
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación de edad mínima para padre o madre
    //    Asumiendo que los valores de parentesco para "Padre" o "Madre"
    //    son 4 y 5 respectivamente (revísalo en tus datos reales).
    if (isSubmitting) return;
    setIsSubmitting(true);

    // ... Validaciones que ya tengas (documentos, foto, etc.)

    // Verifica si es Padre o Madre y si la edad es < 40
    // IMPORTANTE: Ajusta según cómo guardes el parentesco: numérico o texto
    // Ejemplo si guardas el ID como string '4' o '5':
    if (
      (Number(formData.parentesco) === 4 ||
        Number(formData.parentesco) === 5) &&
      formData.edad < 40
    ) {
      await showCustomAlert(
        "error",
        "Edad insuficiente",
        "Para registrar a un Padre o Madre, la edad debe ser de al menos 40 años.",
        "Aceptar"
      );

      setIsSubmitting(false);
      return;
    }

    // Llamamos a la función validateDocuments
    const { success, message } = validateDocuments(formData);
    if (!success) {
      playSound(false);
      await showCustomAlert("error", "Error", message, "Aceptar");
      setIsSubmitting(false);
      return; // Detenemos el proceso si falta algún documento obligatorio
    }

    //console.log("Enviando formulario...");

    // Validar campos obligatorios según el backend
    if (
      (isEditMode && !currentBeneficiaryId) ||
      !numNomina ||
      !formData.parentesco ||
      !formData.nombre ||
      !formData.sexo ||
      !formData.fNacimiento ||
      !formData.telEmergencia ||
      !formData.nombreEmergencia
    ) {
      await showCustomAlert(
        "error",
        "Error",
        "Todos los campos obligatorios deben completarse.",
        "Aceptar"
      );

      setIsSubmitting(false);
      return;
    }

    // Validar si ya existe un Padre o Madre registrado
    try {
      const { conflict, message } = await validateUniqueParentesco(
        numNomina,
        formData.parentesco
      );
      if (conflict) {
        await showCustomAlert(
          "error",
          "Error",
          error.message || "Ocurrió un error desconocido.",
          "Aceptar"
        );
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      await showCustomAlert(
        "error",
        "Error",
        error.message || "Ocurrió un error desconocido.",
        "Aceptar"
      );
      setIsSubmitting(false);
      return;
    }

    //? Validar la URL de la imagen SOLO si el usuario realmente seleccionó o capturó una foto.
    if (formData.imageUrl && !formData.imageUrl.startsWith("http")) {
      await showCustomAlert(
        "error",
        "Error",
        "Por favor, sube una imagen válida.",
        "Aceptar"
      );

      setIsSubmitting(false);
      return;
    }

    // Validar la URL del acta de concubinato (opcional)
    if (
      formData.actaConcubinatoUrl &&
      !formData.actaConcubinatoUrl.startsWith("http")
    ) {
      await showCustomAlert(
        "error",
        "Error",
        "Por favor, sube un enlace válido para el acta de concubinato.",
        "Aceptar"
      );

      setIsSubmitting(false);
      return;
    }

    // Validar relación exclusiva entre Esposo(a) y Concubino(a)
    try {
      const validationResponse = await fetch(
        "/api/beneficiarios/validarParentesco",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numNomina,
            parentesco: formData.parentesco,
          }),
        }
      );

      // Extraer la respuesta como texto
      const responseText = await validationResponse.text();
      let validationData;
      try {
        validationData = JSON.parse(responseText);
      } catch {
        throw new Error(responseText);
      }
      if (!validationResponse.ok) {
        throw new Error(validationData.message || "Error en la validación");
      }
      if (validationData.conflict) {
        await showCustomAlert(
          "error",
          "Conflicto detectado",
          validationData.message,
          "Aceptar"
        );

        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error(
        "Error durante la validación de parentesco:",
        error.message
      );
      await showCustomAlert("error", "Error", error.message, "Aceptar");

      setIsSubmitting(false);
      return;
    }

    // Formatear fechas a ISO
    const formattedNacimiento = formData.fNacimiento
      ? new Date(formData.fNacimiento).toISOString()
      : null;
    const formattedVigenciaEstudios = formData.vigenciaEstudios
      ? (() => {
          const parsedDate = new Date(formData.vigenciaEstudios);
          if (isNaN(parsedDate.getTime())) {
            console.error(
              "Vigencia de estudios tiene un valor inválido:",
              formData.vigenciaEstudios
            );
            return null;
          }
          return parsedDate.toISOString();
        })()
      : null;

    // Determinar endpoint y método HTTP
    const endpoint = isEditMode
      ? "/api/beneficiarios/editarBeneficiario"
      : "/api/beneficiarios/crearBeneficiario";
    const method = isEditMode ? "PUT" : "POST";

    try {
      // Crear payload para enviar al backend
      const payload = {
        ...(isEditMode && { idBeneficiario: currentBeneficiaryId }),
        noNomina: numNomina,
        parentesco: formData.parentesco,
        nombre: formData.nombre,
        aPaterno: formData.aPaterno,
        aMaterno: formData.aMaterno,
        sexo: formData.sexo,
        fNacimiento: formattedNacimiento,
        escolaridad: formData.escolaridad || null,
        activo: formData.activo || "A",
        alergias: formData.alergias || "",
        sangre: formData.sangre || null,
        telEmergencia: formData.telEmergencia,
        nombreEmergencia: formData.nombreEmergencia,
        esEstudiante: formData.esEstudiante || 0,
        esDiscapacitado: formData.esDiscapacitado || 0,
        vigenciaEstudios: formattedVigenciaEstudios,
        imageUrl: formData.imageUrl,
        urlConstancia: formData.urlConstancia || null,
        urlActaNac: formData.urlActaNac || null,
        urlCurp: formData.urlCurp || null,
        actaMatrimonioUrl: formData.actaMatrimonioUrl || null,
        ineUrl: formData.ineUrl || null,
        cartaNoAfiliacionUrl: formData.cartaNoAfiliacionUrl || null,
        actaDependenciaEconomicaUrl:
          formData.actaDependenciaEconomicaUrl || null,
        actaConcubinatoUrl: formData.actaConcubinatoUrl || null,
        urlIncap: formData.urlIncap || null,
        descriptorFacial: formData.descriptorFacial || "",
        firma: formData.firma,
      };

      console.log("Datos enviados al backend (antes del fetch):", payload);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del backend:", errorData);
        throw new Error(
          isEditMode
            ? "Error al actualizar el beneficiario."
            : "Error al registrar el beneficiario."
        );
      }

      const responseData = await response.json();
      //console.log("Respuesta del backend:", responseData);

      await showCustomAlert(
        "success",
        "Éxito",
        isEditMode
          ? "Beneficiario actualizado correctamente."
          : "Beneficiario registrado correctamente."
      );

      // Resetear formulario tras guardar o actualizar
      setFormData({
        parentesco: "",
        nombre: "",
        aPaterno: "",
        aMaterno: "",
        sexo: "",
        fNacimiento: "",
        escolaridad: "",
        alergias: "",
        sangre: "",
        telEmergencia: "",
        nombreEmergencia: "",
        activo: "A",
        vigenciaEstudios: "",
        esEstudiante: 0,
        esDiscapacitado: 0,
        imageUrl: "",
        urlConstancia: "",
        urlActaNac: "",
        urlCurp: "",
        actaMatrimonioUrl: "",
        ineUrl: "",
        cartaNoAfiliacionUrl: "",
        actaConcubinatoUrl: "",
        urlIncap: "",
        firma: "",
      });

      setIsModalOpen(false);
      fetchBeneficiarios();
    } catch (error) {
      console.error("Error al enviar el formulario:", error.message);
      playSound(false);
      await showCustomAlert("error", "Error", error.message, "Aceptar");
    } finally {
      setIsSubmitting(false);
    }
  };

  //EDITAR BENEFICIAROS//
  const handleEditBeneficiary = (beneficiario) => {
    // 1. Funciones auxiliares para dar formato a fechas
    const formatFecha = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    };

    const formatDateTimeLocal = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
    };

    // 2. Calcula la edad a partir de la fecha de nacimiento
    const edad = calculateAge(new Date(beneficiario.F_NACIMIENTO));

    // 3. Convierto el parentesco a número (por si llega como string)
    const parentescoNum = Number(beneficiario.PARENTESCO);
    //console.log(
    //   "Parentesco del beneficiario (antes de setFormData):",
    //   beneficiario.PARENTESCO,
    //   "tipo:",
    //   typeof beneficiario.PARENTESCO,
    //   "-> usando parentescoNum:",
    //   parentescoNum
    // );

    // 4. Determina el tipo de parentesco de manera numérica
    const isHijo = parentescoNum === 2; // Hijo(a)
    const isPadreOMadre = parentescoNum === 4 || parentescoNum === 5; // Padre (4) o Madre (5)
    const isEsposo = parentescoNum === 1; // Esposo(a)
    const isConcubino = parentescoNum === 3; // Concubino(a)

    // 5. Ajusta showCheckboxes y showUploadFiles de acuerdo a lo anterior
    const showCheckboxes = isHijo && edad >= 16;
    const showUploadFiles = isHijo || isPadreOMadre || isEsposo || isConcubino;

    // 6. Actualiza el formulario
    setFormData({
      parentesco: parentescoNum || "", // GUARDA EL NÚMERO en lugar de string
      nombre: beneficiario.NOMBRE || "",
      aPaterno: beneficiario.A_PATERNO || "",
      aMaterno: beneficiario.A_MATERNO || "",
      sexo: beneficiario.SEXO || "",
      fNacimiento: formatFecha(beneficiario.F_NACIMIENTO) || "",
      edad, // Edad calculada
      alergias: beneficiario.ALERGIAS || "",
      sangre: beneficiario.SANGRE?.toUpperCase().trim() || "",
      telEmergencia: beneficiario.TEL_EMERGENCIA || "",
      nombreEmergencia: beneficiario.NOMBRE_EMERGENCIA || "",
      activo: beneficiario.ACTIVO || "A",
      vigenciaEstudios: beneficiario.VIGENCIA_ESTUDIOS
        ? formatDateTimeLocal(beneficiario.VIGENCIA_ESTUDIOS)
        : "",
      imageUrl: beneficiario.FOTO_URL || "",
      esEstudiante: Number(beneficiario.ESESTUDIANTE) === 1,
      esDiscapacitado: Number(beneficiario.ESDISCAPACITADO) === 1,
      urlConstancia: beneficiario.URL_CONSTANCIA || "",
      urlActaNac: beneficiario.URL_ACTA_NAC || "",
      urlCurp: beneficiario.URL_CURP || "",
      actaMatrimonioUrl: beneficiario.URL_ACTAMATRIMONIO || "",
      ineUrl: beneficiario.URL_INE || "",
      cartaNoAfiliacionUrl: beneficiario.URL_NOISSTE || "",
      actaConcubinatoUrl: beneficiario.URL_CONCUBINATO || "",
      urlIncap: beneficiario.URL_INCAP || "",
      descriptorFacial: beneficiario.DESCRIPTOR_FACIAL || "",
      actaDependenciaEconomicaUrl:
        beneficiario.URL_ACTADEPENDENCIAECONOMICA || "",
      firma: beneficiario.FIRMA || "",

      // Estos flags controlan UI en tu formulario
      showCheckboxes,
      showUploadFiles,
      showEsposoFiles: isEsposo,
      showConcubinoFiles: isConcubino,
    });

    // 7. Ajusta estados de edición y abre el modal
    setCurrentBeneficiaryId(beneficiario.ID_BENEFICIARIO);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  useEffect(() => {}, [formData]);

  // Función para ver los datos del beneficiario
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Función para confirmar y eliminar beneficiario
  const handleDeleteBeneficiary = async (idBeneficiario) => {
    const result = await showCustomAlert(
      "warning",
      "¿Estás seguro?",
      "Esta acción eliminará al beneficiario y su imagen asociada. No se puede deshacer.",
      "Sí, eliminar",
      {
        showCancelButton: true,
        cancelButtonColor: "#3085d6",
        cancelButtonText: "Cancelar",
      }
    ).then((result) => {
      if (result.isConfirmed) {
        // 1. Aquí NO eliminamos directo, sino que guardamos el ID
        setBeneficiaryIdToDelete(idBeneficiario);
        // 2. Abrimos un modal interno (con un input de motivo)
        setDeleteModalOpen(true);
      }
    });
  };

  // En tu confirmDeleteWithReason:
  const confirmDeleteWithReason = async (motivo) => {
    if (!motivo.trim()) {
      await showCustomAlert(
        "warning",
        "Error",
        "Por favor, ingresa un motivo.",
        "Aceptar"
      );
      return;
    }

    try {
      // Manda al backend el beneficiaryIdToDelete y el motivo
      const response = await fetch("/api/beneficiarios/eliminarBeneficiario", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idBeneficiario: beneficiaryIdToDelete,
          motivoEliminacion: motivo, // <-- Envías el motivo aquí
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "No se pudo eliminar el beneficiario."
        );
      }

      await showCustomAlert(
        "success",
        "Eliminado",
        "El beneficiario y su imagen asociada han sido eliminados correctamente.",
        "Aceptar"
      );

      // Cierra el modal de motivo
      setDeleteModalOpen(false);
      // Limpia id en caso de reuso
      setBeneficiaryIdToDelete(null);

      // Refresca la lista
      fetchBeneficiarios();
    } catch (error) {
      console.error("Error al eliminar beneficiario:", error);
      await showCustomAlert(
        "Error",
        error.message || "No se pudo eliminar el beneficiario.",
        "error"
      );
    }
  };

  // Encima del return
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  /** */
  /**TERMINO DE LA FUNCION */

  return (
    <div className={styles.body}>
      <div className={styles.bannerContainer}>
        <Image
          src="/beneficiarios-banner.png"
          alt="Banner"
          width={1100} // Asegúrate de definir un ancho
          height={100} // y altura para la imagen
          priority // Añade esta propiedad para optimizar la carga
          className={styles.banner}
        />
      </div>

      <div className={styles.container}>
        <h1 className={styles.title}>Registro de Beneficiarios</h1>
        <p>
          <button onClick={handleBack} className={styles.backButton}>
            {/* Icono de flecha para el botón de retroceso */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 1-.5.5H3.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L3.707 7.5H14.5A.5.5 0 0 1 15 8z"
              />
            </svg>
            Volver
          </button>
        </p>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Número de Nómina"
            value={numNomina}
            onChange={(e) => setNumNomina(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className={styles.searchInput}
            style={{ textTransform: "uppercase" }}
          />

          <button onClick={handleSearch} className={styles.searchButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={styles.searchButtonIcon}
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
            </svg>
            Buscar
          </button>
        </div>

        <div className={styles.statusContainer}>
          {error && (
            <div className={`${styles.statusCard} ${styles.notFound}`}>
              <p>Empleado no encontrado</p>
            </div>
          )}
          {empleado && (
            <div className={`${styles.statusCard} ${styles.found}`}>
              <p>Empleado Encontrado</p>
            </div>
          )}

          {empleado && (
            <div className={styles.employeeInfoContainer}>
              <div className={styles.employeeDetails}>
                <h2>Detalles del Empleado:</h2>
                <p>
                  <strong>Nombre:</strong>{" "}
                  {`${empleado.nombre} ${empleado.a_paterno} ${empleado.a_materno}`}
                </p>

                <p>
                  <strong>Departamento:</strong> {empleado.departamento}
                </p>
                <p>
                  <strong>Puesto:</strong> {empleado.puesto}
                </p>
              </div>

              {/* Card de sindicato al lado de la información del empleado */}
              {empleado.sindicato && (
                <div className={styles.sindicatoBadge}>
                  <p className={styles.sindicatoText}>Sindicalizado</p>
                  <p className={styles.sindicatoName}>
                    Sindicato: {empleado.sindicato}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {empleado && (
          <button
            onClick={handleAddBeneficiary}
            className={styles.addBeneficiaryButton}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 1a.5.5 0 0 1 .5.5v6h6a.5.5 0 0 1 0 1h-6v6a.5.5 0 0 1-1 0v-6h-6a.5.5 0 0 1 0-1h6v-6A.5.5 0 0 1 8 1z" />
            </svg>
            Agregar Beneficiario
          </button>
        )}

        <div className="modal">
          <div className="modal-content"></div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => {
            setIsModalOpen(false);
            setFormData({
              parentesco: "",
              nombre: "",
              aPaterno: "",
              aMaterno: "",
              sexo: "",
              fNacimiento: "",
              alergias: "",
              telEmergencia: "",
              nombreEmergencia: "",
              imageUrl: "",
              esEstudiante: 0,
              esDiscapacitado: 0,
              vigenciaEstudios: "",
              edad: "",
              showCheckboxes: false,
              urlConstancia: "", // Limpiar URL de la constancia
              urlCurp: "", // Limpiar URL del CURP
              urlActaNac: "", // Limpiar URL del acta de nacimiento
              actaMatrimonioUrl: "", // Limpiar URL del acta de matrimonio
              ineUrl: "", // Limpiar URL del INE
              cartaNoAfiliacionUrl: "", // Limpiar URL de la carta de no afiliación
              actaConcubinatoUrl: "", // Nuevo: Limpiar URL del acta de concubinato
              actaDependenciaEconomicaUrl: "", // Nuevo campo para el acta de dependencia económica
              urlIncap: "", // Nuevo campo para el archivo de incapacidad
              firma: "", // Limpiar URL de la firma
            });
          }}
          overlayClassName={styles.modalOverlay}
          className={styles.modal}
        >
          <form onSubmit={handleModalSubmit} className={styles.form}>
            <h2 className={styles.title}>
              {isEditMode ? "Editar Beneficiario" : "Registrar Beneficiario"}
            </h2>

            <fieldset className={styles.fieldset}>
              <legend>Datos Personales</legend>
              {/* Nombre, Apellido Paterno y Apellido Materno */}
              <div className={styles.inputRow}>
                <label className={styles.inputLabel}>
                  <FaUser className={styles.icon} /> Nombre:
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    required
                  />
                </label>
                <label className={styles.inputLabel}>
                  <FaUser className={styles.icon} /> Apellido Paterno:
                  <input
                    type="text"
                    name="aPaterno"
                    value={formData.aPaterno}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    required
                  />
                </label>
                <label className={styles.inputLabel}>
                  <FaUser className={styles.icon} /> Apellido Materno:
                  <input
                    type="text"
                    name="aMaterno"
                    value={formData.aMaterno}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputRow}>
                {/* Campo Sexo con Ícono de Género */}
                <div className={styles.inputGroup}>
                  <label htmlFor="sexo" className={styles.inputLabel}>
                    <FaVenusMars className={styles.inputIcon} /> Sexo
                  </label>
                  <div className={styles.inputWithIcon}>
                    <select
                      id="sexo"
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleInputChange}
                      className={styles.inputField}
                    >
                      <option value="">Seleccione</option>
                      {sexoOptions.map((option) => (
                        <option key={option.idSexo} value={option.idSexo}>
                          {option.sexo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campo Fecha de Nacimiento */}
                <div className={styles.inputGroup}>
                  <label htmlFor="fNacimiento" className={styles.inputLabel}>
                    <FaCalendarAlt className={styles.icon} /> Fecha de
                    Nacimiento
                  </label>
                  <input
                    type="date"
                    id="fNacimiento"
                    name="fNacimiento"
                    value={formData.fNacimiento}
                    onChange={(e) => {
                      handleInputChange(e);

                      const birthDate = new Date(e.target.value);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();

                      if (
                        monthDiff < 0 ||
                        (monthDiff === 0 &&
                          today.getDate() < birthDate.getDate())
                      ) {
                        age--;
                      }

                      setFormData((prev) => ({
                        ...prev,
                        edad: age,
                      }));

                      const isHijo = formData.parentesco === "Hijo(a)";
                      const isMayorOIgual16 = age >= 16;

                      setFormData((prev) => ({
                        ...prev,
                        showCheckboxes: isHijo && isMayorOIgual16,
                        esEstudiante: 0,
                        esDiscapacitado: 0,
                      }));
                    }}
                    className={styles.inputField}
                    required
                  />
                </div>

                {/* Mostrar Edad Dinámica */}
                <div className={styles.ageDisplayWrapper}>
                  {formData.edad && (
                    <span className={styles.ageDisplay}>
                      Edad: {formData.edad} años
                    </span>
                  )}
                </div>
              </div>

              {/* Parentesco, CURP y Alergias */}
              <div className={styles.inputRow}>
                <label className={styles.inputLabel}>
                  <FaUsers className={styles.icon} /> Parentesco:
                  <select
                    name="parentesco"
                    value={formData.parentesco}
                    onChange={(e) => {
                      // 1. Conviértelo a número
                      const selectedId = Number(e.target.value);

                      // 2. Encuentra la opción en tu arreglo parentescoOptions
                      const selectedOption = parentescoOptions.find(
                        (option) => option.ID_PARENTESCO === selectedId
                      );
                      const selectedParentescoText = selectedOption
                        ? selectedOption.PARENTESCO
                        : "";

                      // 3. Verifica el tipo de parentesco según ID o según el texto
                      //    (aquí ejemplo: 2 -> Hijo, 4 -> Padre, 5 -> Madre, 1 -> Esposo(a), 3 -> Concubino(a))
                      const isHijo = selectedId === 2;
                      const isPadreOMadre =
                        selectedId === 4 || selectedId === 5;
                      const isEsposo = selectedId === 1;
                      const isConcubino = selectedId === 3;

                      // 4. Actualiza el formData
                      setFormData((prev) => ({
                        ...prev,
                        // Aquí lo guardas como número, ¡no string!
                        parentesco: selectedId,

                        // Mostrar inputs de documentos si se trata de Hijo, Padre/Madre, etc.
                        showUploadFiles:
                          isHijo || isPadreOMadre || isEsposo || isConcubino,
                        showEsposoFiles: isEsposo,
                        showConcubinoFiles: isConcubino,

                        // Checkboxes si es Hijo y tiene >=16 años
                        showCheckboxes: isHijo && prev.edad >= 16,

                        // Limpia flags de estudiante/discapacitado al cambiar
                        esEstudiante: 0,
                        esDiscapacitado: 0,

                        // Limpia campos de documentos si deseas
                        actaNacimientoUrl: "",
                        curpFileUrl: "",
                        actaConcubinatoUrl: "",
                      }));
                    }}
                    className={styles.inputField}
                    required
                  >
                    <option value="">Selecciona</option>
                    {parentescoOptions.map((option) => (
                      <option
                        key={option.ID_PARENTESCO}
                        value={option.ID_PARENTESCO}
                      >
                        {option.PARENTESCO}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.inputLabel}>
                  <FaDisease className={styles.icon} /> Alergias:
                  <input
                    type="text"
                    name="alergias"
                    value={formData.alergias}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>
              {/* Mostrar campos de documentos requeridos si aplica */}
              {formData.showUploadFiles && (
                <fieldset className={styles.fieldset}>
                  <legend>Documentos Requeridos</legend>

                  {/* Subir Acta de Nacimiento */}
                  <div className={styles.inputRow2}>
                    <label className={styles.inputLabel2}>
                      <FaFileUpload className={styles.icon} /> Acta de
                      Nacimiento - SUBIR:
                      <div className={styles.fileInputWrapper2}>
                        <input
                          type="file"
                          name="actaNacimiento"
                          accept="application/pdf"
                          onChange={handleFileUploadActa}
                          className={styles.fileInput2}
                          id="acta-nacimiento-upload"
                        />
                        <label
                          htmlFor="acta-nacimiento-upload"
                          className={styles.uploadButton2}
                        >
                          Seleccionar archivo
                        </label>
                        <span className={styles.fileName2}>
                          {formData.urlActaNac
                            ? getFileNameFromURL(formData.urlActaNac)
                            : "Sin archivo seleccionado"}
                        </span>
                      </div>
                    </label>

                    {/* Botón para ver el archivo actual del Acta de Nacimiento */}
                    {formData.urlActaNac && (
                      <button
                        type="button"
                        className={styles.viewButton2}
                        onClick={async () => {
                          if (formData.urlActaNac) {
                            window.open(formData.urlActaNac, "_blank");
                          } else {
                            await showCustomAlert(
                              "error",
                              "Error",
                              "No se encontró un Acta de Nacimiento válida.",
                              "Aceptar"
                            );
                          }
                        }}
                      >
                        Ver Acta Actual
                      </button>
                    )}
                  </div>

                  {/* Subir CURP */}
                  <div className={styles.inputRow2}>
                    <label className={styles.inputLabel2}>
                      <FaFileUpload className={styles.icon} /> CURP - SUBIR:
                      <div className={styles.fileInputWrapper2}>
                        <input
                          type="file"
                          name="curp"
                          accept="application/pdf"
                          onChange={handleFileUploadCurp}
                          className={styles.fileInput2}
                          id="curp-upload"
                        />
                        <label
                          htmlFor="curp-upload"
                          className={styles.uploadButton2}
                        >
                          Seleccionar archivo
                        </label>
                        <span className={styles.fileName2}>
                          {formData.urlCurp
                            ? getFileNameFromURL(formData.urlCurp)
                            : "Sin archivo seleccionado"}
                        </span>
                      </div>
                    </label>

                    {formData.urlCurp && (
                      <button
                        type="button"
                        className={styles.viewButton2}
                        onClick={async () => {
                          if (formData.urlCurp) {
                            window.open(formData.urlCurp, "_blank");
                          } else {
                            await showCustomAlert(
                              "error",
                              "Error",
                              "No se encontró un CURP válido.",
                              "Aceptar"
                            );
                          }
                        }}
                      >
                        Ver CURP Actual
                      </button>
                    )}
                  </div>

                  {/* ****** Documentos para Padre o Madre ****** */}
                  {isPadreOMadre && (
                    <>
                      {/* Acta de Dependencia Económica */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> Acta de
                          Dependencia Económica – SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUploadActaEconomica}
                              className={styles.fileInput2}
                              id="acta-economica-upload"
                            />
                            <label
                              htmlFor="acta-economica-upload"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.actaDependenciaEconomicaUrl
                                ? getFileNameFromURL(
                                    formData.actaDependenciaEconomicaUrl
                                  )
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>
                        {formData.actaDependenciaEconomicaUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={() =>
                              window.open(
                                formData.actaDependenciaEconomicaUrl,
                                "_blank"
                              )
                            }
                          >
                            Ver Acta Económica
                          </button>
                        )}
                      </div>

                      {/* Carta de No Afiliación */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> Carta de No
                          Afiliación – SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUploadCartaNoAfiliacion}
                              className={styles.fileInput2}
                              id="carta-no-afiliacion-upload"
                            />
                            <label
                              htmlFor="carta-no-afiliacion-upload"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.cartaNoAfiliacionUrl
                                ? getFileNameFromURL(
                                    formData.cartaNoAfiliacionUrl
                                  )
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>
                        {formData.cartaNoAfiliacionUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={() =>
                              window.open(
                                formData.cartaNoAfiliacionUrl,
                                "_blank"
                              )
                            }
                          >
                            Ver Carta
                          </button>
                        )}
                      </div>

                      {/* ** NUEVO: Subir INE para Padre/Madre ** */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> INE – SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUploadINE}
                              className={styles.fileInput2}
                              id="ine-upload-padre-madre"
                            />
                            <label
                              htmlFor="ine-upload-padre-madre"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.ineUrl
                                ? getFileNameFromURL(formData.ineUrl)
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>
                        {formData.ineUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={() =>
                              window.open(formData.ineUrl, "_blank")
                            }
                          >
                            Ver INE Actual
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Campos adicionales para Esposo(a) */}
                  {formData.showEsposoFiles && (
                    <>
                      {/* Subir Acta de Matrimonio */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> Cargar Acta
                          de Matrimonio de Clave Única:
                          <div className={styles.fileInputWrapper2}>
                            {/* Botón grande para cargar vía Clave Única */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!numNomina) {
                                  console.error(
                                    "[ERROR] Número de nómina no ingresado."
                                  );
                                  await showCustomAlert(
                                    "error",
                                    "Nómina no encontrada",
                                    "El número de nómina ingresado no existe o no se encuentra en el sistema. Intenta nuevamente.",
                                    "Aceptar"
                                  );
                                  return;
                                }

                                try {
                                  //console.log(
                                  //   `[INFO] Solicitando acta de matrimonio para nómina: ${numNomina}`
                                  // );

                                  const response = await fetch(
                                    "/api/beneficiarios/validarActaMatrimonio",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ numNomina }),
                                    }
                                  );

                                  const result = await response.json();
                                  //console.log(
                                  //   "[DEBUG] Respuesta de la API:",
                                  //   result
                                  // );

                                  if (!response.ok) {
                                    console.error(
                                      "[ERROR] Error en la respuesta de la API:",
                                      result.message
                                    );
                                    throw new Error(result.message);
                                  }

                                  // Actualizar la URL del acta de matrimonio en el estado
                                  setFormData((prev) => ({
                                    ...prev,
                                    actaMatrimonioUrl: result.url,
                                  }));

                                  await showCustomAlert(
                                    "success",
                                    "Éxito",
                                    "Acta de Matrimonio cargada correctamente.",
                                    "Aceptar"
                                  );
                                } catch (error) {
                                  console.error(
                                    "[ERROR] Error al cargar el acta de matrimonio:",
                                    error.message
                                  );
                                  await showCustomAlert(
                                    "error",
                                    "Error",
                                    error.message ||
                                      "Ocurrió un error al cargar el acta de matrimonio.",
                                    "Aceptar"
                                  );
                                }
                              }}
                              className={styles.uploadButton3}
                            >
                              Cargar Acta de Matrimonio
                            </button>

                            {/* Pequeño botón-ícono para subida manual */}
                            <button
                              type="button"
                              className={styles.iconButton} // Clase CSS para un botón pequeño/ícono
                              onClick={() => {
                                // Disparamos un click al <input> oculto
                                const fileInput = document.getElementById(
                                  "acta-matrimonio-manual-upload"
                                );
                                if (fileInput) fileInput.click();
                              }}
                              title="Subir Acta de Matrimonio Manual (PDF)"
                            >
                              <FaFileAlt />
                            </button>

                            {/* Input oculto para subir manualmente el archivo PDF */}
                            <input
                              type="file"
                              id="acta-matrimonio-manual-upload"
                              name="actaMatrimonioManual"
                              accept="application/pdf"
                              style={{ display: "none" }}
                              onChange={handleFileUploadActaMatrimonioManual}
                            />

                            <span className={styles.fileName2}>
                              {formData.actaMatrimonioUrl
                                ? getFileNameFromURL(formData.actaMatrimonioUrl)
                                : "Sin archivo cargado"}
                            </span>
                          </div>
                        </label>

                        {/* Botón para ver el archivo si ya está en formData */}
                        {formData.actaMatrimonioUrl && (
                          <button
                            type="button"
                            className={styles.viewButton3}
                            onClick={() =>
                              window.open(formData.actaMatrimonioUrl, "_blank")
                            }
                          >
                            Ver Acta de Matrimonio
                          </button>
                        )}
                      </div>
                      {/* Subir INE */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> INE - SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              name="ine"
                              accept="application/pdf"
                              onChange={handleFileUploadINE}
                              className={styles.fileInput2}
                              id="ine-upload"
                            />
                            <label
                              htmlFor="ine-upload"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.ineUrl
                                ? getFileNameFromURL(formData.ineUrl)
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>

                        {formData.ineUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={async () => {
                              if (formData.ineUrl) {
                                window.open(formData.ineUrl, "_blank");
                              } else {
                                await showCustomAlert(
                                  "error",
                                  "Error",
                                  "No se encontró un INE válido.",
                                  "Aceptar"
                                );
                              }
                            }}
                          >
                            Ver INE Actual
                          </button>
                        )}
                      </div>

                      {/* Subir Carta de No Afiliación */}
                      <div className={styles.inputRow2}>
                        <label className={styles.inputLabel2}>
                          <FaFileUpload className={styles.icon} /> Carta de No
                          Afiliación - SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              name="cartaNoAfiliacion"
                              accept="application/pdf"
                              onChange={handleFileUploadCartaNoAfiliacion}
                              className={styles.fileInput2}
                              id="carta-no-afiliacion-upload"
                            />
                            <label
                              htmlFor="carta-no-afiliacion-upload"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.cartaNoAfiliacionUrl
                                ? getFileNameFromURL(
                                    formData.cartaNoAfiliacionUrl
                                  )
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>

                        {formData.cartaNoAfiliacionUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={async () => {
                              if (formData.cartaNoAfiliacionUrl) {
                                window.open(
                                  formData.cartaNoAfiliacionUrl,
                                  "_blank"
                                );
                              } else {
                                await showCustomAlert(
                                  "error",
                                  "Error",
                                  "No se encontró una Carta de No Afiliación válida.",
                                  "Aceptar"
                                );
                              }
                            }}
                          >
                            Ver Carta de No Afiliación Actual
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </fieldset>
              )}

              {formData.showConcubinoFiles && (
                <>
                  {/* --- Acta de Concubinato --- */}
                  <div className={styles.inputRow2}>
                    <label className={styles.inputLabel2}>
                      <FaFileUpload className={styles.icon} /> Cargar Acta de
                      Concubinato desde Clave Única:
                      <div className={styles.fileInputWrapper2}>
                        {/* Botón principal para cargar vía Clave Única */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!numNomina) {
                              await showCustomAlert(
                                "error",
                                "Nómina no encontrada",
                                "El número de nómina ingresado no existe o no se encuentra en el sistema. Intenta nuevamente.",
                                "Aceptar"
                              );
                              return;
                            }
                            try {
                              const response = await fetch(
                                "/api/beneficiarios/validarActaConcubinato",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ numNomina }),
                                }
                              );
                              const result = await response.json();
                              if (!response.ok) throw new Error(result.message);
                              setFormData((prev) => ({
                                ...prev,
                                actaConcubinatoUrl: result.url,
                              }));
                              await showCustomAlert(
                                "success",
                                "Éxito",
                                "Acta de Concubinato cargada correctamente.",
                                "Aceptar"
                              );
                            } catch (error) {
                              await showCustomAlert(
                                "error",
                                "Error",
                                error.message ||
                                  "Ocurrió un error desconocido.",
                                "Aceptar"
                              );
                            }
                          }}
                          className={styles.uploadButton3}
                        >
                          Cargar Acta de Concubinato
                        </button>

                        {/* Ícono para subida manual */}
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() =>
                            document
                              .getElementById("acta-concubinato-manual-upload")
                              ?.click()
                          }
                          title="Subir manualmente (PDF)"
                        >
                          <FaFileAlt />
                        </button>

                        {/* Input oculto para subida manual */}
                        <input
                          type="file"
                          id="acta-concubinato-manual-upload"
                          accept="application/pdf"
                          style={{ display: "none" }}
                          onChange={handleFileUploadActaConcubinatoManual}
                        />

                        <span className={styles.fileName2}>
                          {formData.actaConcubinatoUrl
                            ? getFileNameFromURL(formData.actaConcubinatoUrl)
                            : "Sin archivo cargado"}
                        </span>
                      </div>
                    </label>

                    {formData.actaConcubinatoUrl && (
                      <button
                        type="button"
                        className={styles.viewButton3}
                        onClick={() =>
                          window.open(formData.actaConcubinatoUrl, "_blank")
                        }
                      >
                        Ver Acta de Concubinato
                      </button>
                    )}
                  </div>

                  {/* --- INE para Concubinato --- */}
                  <div className={styles.inputRow2}>
                    <label className={styles.inputLabel2}>
                      <FaFileUpload className={styles.icon} /> INE – SUBIR:
                      <div className={styles.fileInputWrapper2}>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUploadINE}
                          className={styles.fileInput2}
                          id="ine-upload-concubino"
                        />
                        <label
                          htmlFor="ine-upload-concubino"
                          className={styles.uploadButton2}
                        >
                          Seleccionar archivo
                        </label>
                        <span className={styles.fileName2}>
                          {formData.ineUrl
                            ? getFileNameFromURL(formData.ineUrl)
                            : "Sin archivo seleccionado"}
                        </span>
                      </div>
                    </label>
                    {formData.ineUrl && (
                      <button
                        type="button"
                        className={styles.viewButton2}
                        onClick={() => window.open(formData.ineUrl, "_blank")}
                      >
                        Ver INE Actual
                      </button>
                    )}
                  </div>

                  {/* Carta de No Afiliación */}
                  <div className={styles.inputRow2}>
                    <label className={styles.inputLabel2}>
                      <FaFileUpload className={styles.icon} /> Carta de No
                      Afiliación – SUBIR:
                      <div className={styles.fileInputWrapper2}>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUploadCartaNoAfiliacion}
                          className={styles.fileInput2}
                          id="carta-no-afiliacion-upload"
                        />
                        <label
                          htmlFor="carta-no-afiliacion-upload"
                          className={styles.uploadButton2}
                        >
                          Seleccionar archivo
                        </label>
                        <span className={styles.fileName2}>
                          {formData.cartaNoAfiliacionUrl
                            ? getFileNameFromURL(formData.cartaNoAfiliacionUrl)
                            : "Sin archivo seleccionado"}
                        </span>
                      </div>
                    </label>
                    {formData.cartaNoAfiliacionUrl && (
                      <button
                        type="button"
                        className={styles.viewButton2}
                        onClick={() =>
                          window.open(formData.cartaNoAfiliacionUrl, "_blank")
                        }
                      >
                        Ver Carta
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Checkboxes dinámicos */}
              {showCheckboxes && (
                <div className={styles.inputRow}>
                  <label className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="esEstudiante"
                      checked={formData.esEstudiante}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          esEstudiante: e.target.checked,
                          esDiscapacitado: false, // Desmarcar "Es discapacitado" si se selecciona "Es estudiante"
                          vigenciaEstudios: e.target.checked
                            ? prev.vigenciaEstudios
                            : "",
                        }));
                      }}
                    />
                    <span className={styles.checkmark}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.854 5.146a.5.5 0 0 0-.708 0L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0 0-.708z" />
                      </svg>
                    </span>
                    <span className={styles.label}>Es estudiante</span>
                  </label>

                  <label className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="esDiscapacitado"
                      checked={formData.esDiscapacitado}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        //console.log(
                        //   "Checkbox 'Es Discapacitado' actualizado:",
                        //   isChecked
                        // );

                        setFormData((prev) => ({
                          ...prev,
                          esDiscapacitado: isChecked,
                          esEstudiante: false, // Desmarcar "Es estudiante" si se selecciona "Es discapacitado"
                          vigenciaEstudios: isChecked ? "30/09/2027" : "", // Asignar vigencia fija o limpiar si se desmarca
                          urlIncap: isChecked ? prev.urlIncap : "", // Limpiar URL si se desmarca
                        }));
                      }}
                    />
                    <span className={styles.checkmark}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.854 5.146a.5.5 0 0 0-.708 0L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0 0-.708z" />
                      </svg>
                    </span>
                    <span className={styles.label}>Es discapacitado</span>
                  </label>
                </div>
              )}

              {/* Campo para subir el acta de incapacidad */}
              {formData.esDiscapacitado && (
                <div className={styles.inputRow2}>
                  <label className={styles.inputLabel2}>
                    <FaFileUpload className={styles.icon} /> Acta de Incapacidad
                    - SUBIR:
                    <div className={styles.fileInputWrapper2}>
                      <input
                        type="file"
                        name="actaIncapacidad"
                        accept="application/pdf"
                        onChange={handleFileUploadIncap} // Asignar la nueva función
                        className={styles.fileInput2}
                        id="acta-incapacidad-upload"
                      />
                      <label
                        htmlFor="acta-incapacidad-upload"
                        className={styles.uploadButton2}
                      >
                        Seleccionar archivo
                      </label>
                      <span className={styles.fileName2}>
                        {formData.urlIncap
                          ? getFileNameFromURL(formData.urlIncap)
                          : "Sin archivo seleccionado"}
                      </span>
                    </div>
                  </label>

                  {/* Botón para ver el archivo cargado */}
                  {formData.urlIncap && (
                    <button
                      type="button"
                      className={styles.viewButton2}
                      onClick={async () => {
                        if (formData.urlIncap) {
                          window.open(formData.urlIncap, "_blank");
                        } else {
                          await showCustomAlert(
                            "error",
                            "Error",
                            "No se encontró un Acta de Incapacidad válida.",
                            "Aceptar"
                          );
                        }
                      }}
                    >
                      Ver Acta Actual
                    </button>
                  )}
                </div>
              )}

              {/* Vigencia de Estudios */}
              {formData.esEstudiante && (
                <div className={styles.inputRow}>
                  <label className={styles.inputLabel}>
                    Vigencia de Estudios:
                    <input
                      type="date" // sólo fecha
                      name="vigenciaEstudios"
                      value={
                        formData.vigenciaEstudios
                          ? formData.vigenciaEstudios.slice(0, 10) // mostramos sólo "YYYY-MM-DD"
                          : ""
                      }
                      onChange={handleVigenciaChange}
                      className={styles.inputField}
                      required
                    />
                  </label>
                </div>
              )}

              {formData.esEstudiante && (
                <div className={styles.inputRow2}>
                  <label className={styles.inputLabel2}>
                    <FaFileUpload className={styles.icon} /> Constancia de
                    Estudios - SUBIR:
                    <div className={styles.fileInputWrapper2}>
                      <input
                        type="file"
                        name="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className={styles.fileInput2}
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={styles.uploadButton2}
                      >
                        Seleccionar archivo
                      </label>
                      <span className={styles.fileName2}>
                        {formData.fileName || "Sin archivo seleccionado"}
                      </span>
                    </div>
                  </label>

                  {isEditMode && formData.urlConstancia && (
                    <span className={styles.fileInfo2}>
                      {`Archivo actual: ${getFileNameFromURL(
                        formData.urlConstancia
                      )}`}
                    </span>
                  )}

                  <div className={styles.inputRow2}>
                    <button
                      type="button"
                      className={styles.viewButton2}
                      onClick={async () => {
                        if (formData.urlConstancia) {
                          window.open(formData.urlConstancia, "_blank");
                        } else {
                          await showCustomAlert(
                            "error",
                            "Error",
                            "No se encontró una constancia válida.",
                            "Aceptar"
                          );
                        }
                      }}
                    >
                      Ver Constancia Actual
                    </button>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Contenedor para alinear ambos botones */}
            <div className={`${styles.inputRow} ${styles.flexRow}`}>
              {/* Botón para subir foto */}
              <label className={styles.uploadLabel}>
                <span className={styles.uploadButton}>
                  <FaFileUpload className={styles.icon} /> Subir Foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.hiddenInput}
                />
              </label>

              {/* Botón para capturar foto */}
              <div className={styles.cameraContainer}>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className={styles.cameraButton}
                  disabled={loading}
                >
                  {loading ? (
                    "Cargando..."
                  ) : (
                    <>
                      <FaCamera className={styles.cameraIcon} />
                      Capturar Foto
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Campo de Tipo de Sangre */}
            <div className={styles.inputGroup}>
              <label htmlFor="sangre" className={styles.inputLabel}>
                Tipo de Sangre
              </label>
              <select
                id="sangre"
                name="sangre"
                value={formData.sangre} // Enlazado al estado `formData.sangre`
                onChange={handleInputChange} // Actualiza `formData.sangre` al cambiar
                className={styles.inputField}
              >
                <option value="">Seleccione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            {/* Vista previa de la imagen */}
            {imagePreview && (
              <div className={styles.imagePreview}>
                <Image
                  src={formData.imageUrl}
                  alt="Vista previa de la foto"
                  width={150}
                  height={150}
                  className={styles.previewImage}
                />
              </div>
            )}

            <fieldset className={styles.fieldset}>
              <legend>En caso de emergencia avisar a:</legend>
              <div className={styles.inputRow}>
                <label className={styles.inputLabel}>
                  <FaPhone className={styles.icon} /> Teléfono:
                  <input
                    type="tel"
                    name="telEmergencia"
                    value={formData.telEmergencia}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    required
                  />
                </label>
                <label className={styles.inputLabel}>
                  <FaUser className={styles.icon} /> Nombre:
                  <input
                    type="text"
                    name="nombreEmergencia"
                    value={formData.nombreEmergencia}
                    onChange={handleInputChange}
                    className={styles.inputField}
                    required
                  />
                </label>
              </div>
              <button
                type="button"
                className={styles.signatureButton}
                onClick={handleOpenFirma}
              >
                Firma
              </button>

              {isFirmaOpen && (
                <div className={styles.signatureModal}>
                  <h3 className={styles.signatureTitle}>
                    Firme en el recuadro:
                  </h3>
                  <SignatureCanvas
                    ref={signatureRef}
                    backgroundColor="transparent"
                    penColor="black"
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: styles.signatureCanvas,
                    }}
                  />

                  <div className={styles.signatureButtons}>
                    {formData.firma && (
                      <div className={styles.signaturePreview}>
                        <Image
                          src={formData.firma}
                          alt="Firma actual"
                          width={200}
                          height={100}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, firma: "" }))
                          }
                        >
                          Quitar firma
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={handleClearFirma}
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleSaveFirma}
                    >
                      Guardar Firma
                    </button>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Botones */}
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={`${styles.submitButton} ${
                  isSaveDisabled ? styles.disabled : ""
                }`}
                disabled={isSaveDisabled || isSubmitting}
              >
                <FaSave className={`${styles.icon} ${styles.iconLarge}`} />
                {isEditMode ? "Actualizar" : "Guardar"}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.cancelButton}
              >
                <FaTimes className={`${styles.icon} ${styles.iconLarge}`} />
                Cancelar
              </button>
            </div>
          </form>
        </Modal>

        <div>
          {/* Todo tu JSX (banner, tabla, etc.) */}

          <Modal
            isOpen={deleteModalOpen} // Usar deleteModalOpen
            onRequestClose={() => {
              setDeleteModalOpen(false); // Usar setDeleteModalOpen
              setBeneficiaryIdToDelete(null);
            }}
            overlayClassName={styles.modalOverlay}
            className={styles.modal}
          >
            <div className={styles.modalContent}>
              <h2>Motivo de la eliminación</h2>
              <textarea
                className={styles.inputField}
                rows={4}
                placeholder="Explica por qué eliminarás este beneficiario..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => confirmDeleteWithReason(deleteReason)}
                  className={styles.deleteButton}
                >
                  Eliminar
                </button>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setBeneficiaryIdToDelete(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        </div>

        <Modal
          key={isViewModalOpen ? "open" : "closed"} // Forzar un re-render al abrir/cerrar
          isOpen={isViewModalOpen}
          onRequestClose={() => {
            setIsViewModalOpen(false); // Cerrar modal
            setSelectedBeneficiary(null); // Limpiar beneficiario seleccionado
          }}
          overlayClassName={styles.modalOverlay}
          className={styles.modal}
        >
          {selectedBeneficiary && (
            <div className={styles.modalContent}>
              {/* Imagen del Beneficiario */}
              <div className={styles.imageSection}>
                {selectedBeneficiary.FOTO_URL ? (
                  <Image
                    src={selectedBeneficiary.FOTO_URL}
                    alt={`${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO}`}
                    width={150}
                    height={150}
                    className={styles.beneficiaryImage}
                  />
                ) : (
                  <p className={styles.noImageText}>Imagen no disponible</p>
                )}
              </div>

              {/* Información Personal */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <FaUser size={20} /> Información Personal
                </h3>
                <ul className={styles.cardList}>
                  <li>
                    <strong>ID:</strong> {selectedBeneficiary.ID_BENEFICIARIO}
                  </li>
                  <li>
                    <strong>Número de Nómina:</strong>{" "}
                    {selectedBeneficiary.NO_NOMINA}
                  </li>
                  <li>
                    <strong>Nombre Completo:</strong>{" "}
                    {`${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`}
                  </li>
                  <li>
                    <strong>Tipo de sangre:</strong>{" "}
                    {selectedBeneficiary.SANGRE}
                  </li>
                  <li>
                    <strong>Sexo:</strong>{" "}
                    {sexoOptions.find(
                      (s) =>
                        String(s.idSexo) === String(selectedBeneficiary.SEXO)
                    )?.sexo || "Desconocido"}
                  </li>
                  <li>
                    <strong>Fecha de Nacimiento:</strong>{" "}
                    {selectedBeneficiary.F_NACIMIENTO}
                  </li>
                  <li>
                    <strong>Edad:</strong>{" "}
                    {calculateAge(
                      convertToDate(selectedBeneficiary.F_NACIMIENTO)
                    )}
                  </li>
                  <li>
                    <strong>Activo:</strong>{" "}
                    {selectedBeneficiary.ACTIVO === "A" ? "Sí" : "No"}
                  </li>
                </ul>
              </div>

              {/* Información Adicional */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <FaInfoCircle size={20} /> Información Adicional
                </h3>
                <ul className={styles.cardList}>
                  <li>
                    <strong>Parentesco:</strong>{" "}
                    {parentescoOptions.find(
                      (p) => p.ID_PARENTESCO === selectedBeneficiary.PARENTESCO
                    )?.PARENTESCO || "Desconocido"}
                  </li>
                  <li>
                    <strong>Alergias:</strong>{" "}
                    {selectedBeneficiary.ALERGIAS || "Ninguna"}
                  </li>
                  <li>
                    <strong>Teléfono de Emergencia:</strong>{" "}
                    {selectedBeneficiary.TEL_EMERGENCIA || "N/A"}
                  </li>
                  <li>
                    <strong>Nombre de Contacto de Emergencia:</strong>{" "}
                    {selectedBeneficiary.NOMBRE_EMERGENCIA || "N/A"}
                  </li>
                </ul>
              </div>

              {/* Botones */}
              <div className={styles.buttonsContainer}>
                <button
                  onClick={() => handlePrintCredential(selectedBeneficiary)}
                  className={`${styles.printButton} ${styles.greenButton}`}
                >
                  <FaIdCard size={16} /> Imprimir Credencial
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleGenerateCard(selectedBeneficiary);
                    } catch (error) {
                      console.error("Error al generar el carnet:", error);
                      await showCustomAlert(
                        "error",
                        "Error",
                        "No se pudo generar el carnet. Intenta nuevamente.",
                        "Aceptar"
                      );
                    }
                  }}
                  className={`${styles.printButton} ${styles.blueButton}`}
                >
                  <FaPrint size={16} /> Imprimir Carnet
                </button>

                <button
                  onClick={() => setIsDocumentsModalOpen(true)}
                  className={`${styles.printButton} ${styles.purpleButton}`}
                >
                  <FaFileAlt size={16} /> Ver Documentos
                </button>

                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className={`${styles.printButton} ${styles.redButton}`}
                >
                  <FaTimes size={16} /> Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isDocumentsModalOpen}
          onRequestClose={() => handleCloseModal()} // Llamamos a una función para cerrar con fadeOut
          overlayClassName={`${styles.documentsModalOverlay}`}
          className={`${styles.documentsModalContainer} ${
            isFadingOut ? styles.documentsSlideOut : ""
          }`}
        >
          {selectedBeneficiary && (
            <div className={styles.documentsModalContent}>
              <h2 className={styles.documentsModalTitle}>Documentos Subidos</h2>

              {/* Lista de botones para ver documentos */}
              <div className={styles.documentsButtonsWrapper}>
                {/* Acta de Nacimiento */}
                {selectedBeneficiary.URL_ACTA_NAC && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_ACTA_NAC, "_blank")
                    }
                  >
                    <FaFileUpload size={20} />
                    Acta de Nacimiento
                  </button>
                )}

                {/* CURP */}
                {selectedBeneficiary.URL_CURP && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_CURP, "_blank")
                    }
                  >
                    <FaFileAlt size={20} />
                    Ver CURP
                  </button>
                )}

                {/* Constancia */}
                {selectedBeneficiary.URL_CONSTANCIA && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_CONSTANCIA, "_blank")
                    }
                  >
                    <FaFileAlt size={20} />
                    Constancia de Estudios
                  </button>
                )}

                {/* Acta de Matrimonio */}
                {selectedBeneficiary.URL_ACTAMATRIMONIO && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(
                        selectedBeneficiary.URL_ACTAMATRIMONIO,
                        "_blank"
                      )
                    }
                  >
                    <FaFileUpload size={20} />
                    Acta de Matrimonio
                  </button>
                )}

                {/* INE */}
                {selectedBeneficiary.URL_INE && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_INE, "_blank")
                    }
                  >
                    <FaFileAlt size={20} />
                    INE
                  </button>
                )}

                {/* Carta de No Afiliación */}
                {selectedBeneficiary.URL_NOISSTE && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_NOISSTE, "_blank")
                    }
                  >
                    <FaFileAlt size={20} />
                    Carta de No Afiliación
                  </button>
                )}

                {/* Acta de Concubinato */}
                {selectedBeneficiary.URL_CONCUBINATO && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_CONCUBINATO, "_blank")
                    }
                  >
                    <FaFileUpload size={20} />
                    Acta de Concubinato
                  </button>
                )}

                {/* Acta de Incapacidad */}
                {selectedBeneficiary.URL_INCAP && (
                  <button
                    className={styles.documentButton}
                    onClick={() =>
                      window.open(selectedBeneficiary.URL_INCAP, "_blank")
                    }
                  >
                    <FaFileAlt size={20} />
                    Acta de Incapacidad
                  </button>
                )}
              </div>

              {/* Botón para cerrar el modal */}
              <button
                className={styles.closeDocumentButton}
                onClick={() => handleCloseModal()}
              >
                <FaTimes size={20} />
                Cerrar
              </button>
            </div>
          )}
        </Modal>

        {/* Tabla de beneficiarios, solo se muestra si el empleado es encontrado */}
        {empleado &&
          beneficiarios.filter((b) => b.ACTIVO === "A").length > 0 && (
            <div className={styles.tableContainer}>
              <h2>Beneficiarios Registrados</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No. Nómina</th>
                    <th>Parentesco</th>
                    <th>Nombre</th>
                    <th>Apellido Paterno</th>
                    <th>Apellido Materno</th>
                    <th>Fecha de Nacimiento</th>
                    <th>Estatus</th>
                    <th>Alergias</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiarios
                    .filter((beneficiario) => beneficiario.ACTIVO === "A") // Filtra solo beneficiarios activos
                    .map((beneficiario) => {
                      // Encuentra el nombre de parentesco correspondiente usando find
                      const parentesco = parentescoOptions.find(
                        (option) =>
                          option.ID_PARENTESCO === beneficiario.PARENTESCO
                      );

                      return (
                        <tr key={beneficiario.ID_BENEFICIARIO}>
                          <td>{beneficiario.NO_NOMINA}</td>
                          <td>{parentesco ? parentesco.PARENTESCO : "N/A"}</td>
                          <td>{beneficiario.NOMBRE}</td>
                          <td>{beneficiario.A_PATERNO}</td>
                          <td>{beneficiario.A_MATERNO}</td>
                          <td>{beneficiario.F_NACIMIENTO}</td>
                          <td>Activo</td>{" "}
                          {/* Solo se muestra "Activo" porque ya están filtrados */}
                          <td>{beneficiario.ALERGIAS}</td>{" "}
                          <td>
                            <button
                              onClick={() =>
                                handleEditBeneficiary(beneficiario)
                              }
                              className={styles.editButton}
                            >
                              Editar
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteBeneficiary(
                                  beneficiario.ID_BENEFICIARIO
                                )
                              }
                              className={styles.deleteButton}
                            >
                              Eliminar
                            </button>

                            <button
                              onClick={() =>
                                handleViewBeneficiary(beneficiario)
                              }
                              className={styles.viewButton}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                              >
                                <path d="M16 8s-3-5.333-8-5.333S0 8 0 8s3 5.333 8 5.333S16 8 16 8zm-8 4a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
