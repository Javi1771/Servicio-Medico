import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import Modal from "react-modal";
import styles from "../css/beneficiarios.module.css";
import { useRouter } from "next/router";
import { jsPDF } from "jspdf";
import { FaCamera } from "react-icons/fa";
import * as faceapi from "face-api.js";
import SignatureCanvas from 'react-signature-canvas';



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

Modal.setAppElement("#__next"); // Configuración del modal en Next.js

export default function RegistroBeneficiario() {
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
    actaConcubinatoUrl: "", // Nuevo campo para Acta de Concubinato
    descriptorFacial: "",
    firma: "",
  });


    // Para manejar el recuadro de la firma
    const [isFirmaOpen, setIsFirmaOpen] = useState(false);
    const signatureRef = useRef(null);
  
    // Al hacer clic en el botón “Firma”
    const handleOpenFirma = () => {
      setIsFirmaOpen(true);
    };
  // Al pulsar “Guardar Firma” en el modal de la firma
  const handleSaveFirma = () => {
    if (!signatureRef.current) return;

    // Obtén la imagen en base64 con fondo transparente
    const firmaBase64 = signatureRef.current
    .getCanvas()        // .getCanvas() en vez de .getTrimmedCanvas()
    .toDataURL("image/png");

    // Guardar en el estado
    setFormData((prev) => ({
      ...prev,
      firma: firmaBase64,
    }));

    // Cierra el modal
    setIsFirmaOpen(false);

    // Opcional: podrías hacer un Swal o algún feedback
    Swal.fire("Firmado", "La firma se guardó correctamente.", "success");
  };
    // Al pulsar “Limpiar”
    const handleClearFirma = () => {
      if (!signatureRef.current) return;
      signatureRef.current.clear();
    };





  //* Define las rutas de los sonidos de éxito y error
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

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
        console.log("[face-api] Modelos cargados correctamente en el front");
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

  /*******************SUBIR ACTA DE CONCUBINATO MANUAL ******************/
  const handleFileUploadActaConcubinatoManual = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar la nómina

    try {
      const response = await fetch(
        "/api/beneficiarios/uploadActaConcubinatoManual",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Acta de Concubinato subida manualmente:", data.url);
        // Actualizar el estado con la nueva URL
        setFormData((prev) => ({
          ...prev,
          actaConcubinatoUrl: data.url,
        }));
        playSound(true);
        Swal.fire(
          "Éxito",
          "Acta de Concubinato subida manualmente con éxito.",
          "success"
        );
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir el Acta de Concubinato manual. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Concubinato manual:", error);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo subir el Acta de Concubinato manual.",
        "error"
      );
    }
  };

  /********************************************************************* */

  /*****************SUBIR ACTA DE MATROMONIO MANUAL ********************/
  const handleFileUploadActaMatrimonioManual = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Preparamos FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar la nómina

    try {
      // Llamada al nuevo endpoint que guarda el archivo en el servidor local
      const response = await fetch(
        "/api/beneficiarios/uploadActaMatrimonioManual",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Acta de Matrimonio subida manualmente:", data.url);
        // Actualizar el estado con la nueva URL
        setFormData((prev) => ({
          ...prev,
          actaMatrimonioUrl: data.url,
        }));
        playSound(true);
        Swal.fire(
          "Éxito",
          "Acta de Matrimonio subida manualmente con éxito.",
          "success"
        );
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir el Acta de Matrimonio manual.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Matrimonio manual:", error);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo subir el Acta de Matrimonio manual.",
        "error"
      );
    }
  };

  /********************************************************************* */

  const handleFileUploadIncap = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar el número de nómina

    try {
      const response = await fetch("/api/beneficiarios/uploadIncap", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Acta de incapacidad subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          urlIncap: data.url, // Guardar la URL en el estado
        }));
        playSound(true);
        Swal.fire(
          "Éxito",
          "Acta de Incapacidad subida correctamente.",
          "success"
        );
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir el Acta de Incapacidad. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Incapacidad:", error);
      playSound(false);
      Swal.fire("Error", "No se pudo subir el Acta de Incapacidad.", "error");
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
              playSound(false);
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
          playSound(false);
          Swal.fire("Error", "No se detectó un rostro en la imagen.", "error");
          return;
        }
        const descriptorArray = Array.from(descriptor);
        const descriptorJSON = JSON.stringify(descriptorArray);
        setFormData((prev) => ({
          ...prev,
          descriptorFacial: descriptorJSON,
        }));
        console.log("Descriptor facial calculado:", descriptorJSON);

        // 3. Subir la imagen a tu servidor
        await uploadImage(base64Image);
      }
    } catch (error) {
      console.error("Error al capturar/subir la foto:", error);
      playSound(false);
      Swal.fire("Error", "Ocurrió un problema al capturar la foto.", "error");
    }
  };

  // Función para subir la imagen capturada
  const uploadImage = async (base64Image) => {
    if (!numNomina) {
      playSound(false);
      Swal.fire("Error", "Por favor, ingresa el número de nómina.", "error");
      return;
    }

    try {
      const response = await fetch("/api/beneficiarios/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, numNomina }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        playSound(true);
        Swal.fire("Éxito", "Imagen subida correctamente.", "success");
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          data.error || "No se pudo subir la imagen.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      playSound(false);
      Swal.fire("Error", "Error al subir la imagen.", "error");
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar el número de nómina desde el estado

    try {
      const response = await fetch("/api/beneficiarios/uploadINE", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("INE subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          ineUrl: data.url, // Guardar la URL correcta en el estado
        }));
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir el INE. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el INE:", error);
      playSound(false);
      Swal.fire("Error", "No se pudo subir el INE.", "error");
    }
  };

  const handleFileUploadCartaNoAfiliacion = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar el número de nómina desde el estado

    try {
      const response = await fetch(
        "/api/beneficiarios/uploadCartaNoAfiliacion",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Carta de No Afiliación subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          cartaNoAfiliacionUrl: data.url, // Guardar la URL correcta
        }));
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir la Carta de No Afiliación. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la Carta de No Afiliación:", error);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo subir la Carta de No Afiliación.",
        "error"
      );
    }
  };

  const handleFileUploadCurp = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar el número de nómina desde el estado

    try {
      const response = await fetch("/api/beneficiarios/uploadCurp", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("CURP subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          urlCurp: data.url, // Guardar la URL correcta en el estado
        }));
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir la CURP. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la CURP:", error);
      playSound(false);
      Swal.fire("Error", "No se pudo subir la CURP.", "error");
    }
  };

  const handleFileUploadActa = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Asegúrate de enviar el número de nómina

    try {
      const response = await fetch("/api/beneficiarios/uploadActa", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Acta de Nacimiento subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          urlActaNac: data.url, // Guardar la URL del Acta de Nacimiento
        }));
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir el Acta de Nacimiento. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Nacimiento:", error);
      playSound(false);
      Swal.fire("Error", "No se pudo subir el Acta de Nacimiento.", "error");
    }
  };

  //SUBIR DOCUMENTO DE CONSTANCIA DE ESTUDIOS//
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("numNomina", numNomina); // Enviar el número de nómina desde el estado

    try {
      const response = await fetch("/api/beneficiarios/uploadConstancia", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Constancia de Estudios subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          urlConstancia: data.url, // Guardar la URL pública del archivo
          fileName: file.name, // Guardar también el nombre del archivo
        }));
      } else {
        playSound(false);
        Swal.fire(
          "Error",
          "Error al subir la Constancia de Estudios. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la Constancia de Estudios:", error);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo subir la Constancia de Estudios.",
        "error"
      );
    }
  };

  /**VIGENCIA DE ESTUDIOS VALIDACION */
  const handleVigenciaChange = (e) => {
    const { value } = e.target;
    const selectedDate = new Date(value);
    const currentDate = new Date();

    // Verificar si "Es estudiante" está seleccionado
    if (formData.esEstudiante) {
      // Validar si la fecha es menor a la actual
      if (selectedDate < currentDate) {
        playSound(false);
        Swal.fire({
          icon: "error",
          title: "Vigencia de estudio vencida",
          text: "Por favor, selecciona una fecha válida en el futuro.",
          confirmButtonText: "Entendido",
        });
        setIsSaveDisabled(true); // Deshabilitar el botón de guardar
      } else {
        setIsSaveDisabled(false); // Habilitar el botón si la fecha es válida
      }
    }

    // Actualizar el estado del formulario
    setFormData((prev) => ({
      ...prev,
      vigenciaEstudios: value,
    }));
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
      playSound(false);
      Swal.fire("Error", "El beneficiario no está activo.", "error");
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

    console.log("Datos recibidos del beneficiario:", {
      NO_NOMINA,
      PARENTESCO,
      NOMBRE,
      A_PATERNO,
      A_MATERNO,
      F_NACIMIENTO,
      VIGENCIA_ESTUDIOS,
      ESDISCAPACITADO,
    });

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edad = calculateAge(F_NACIMIENTO); // Calcular la edad
    console.log("Edad calculada:", edad);

    const edadConAnios = `${edad} años`; // Texto para la edad

    // Calcular vigencia
    const vigencia = calcularVigencia(
      PARENTESCO,
      edad,
      VIGENCIA_ESTUDIOS,
      F_NACIMIENTO,
      ESDISCAPACITADO
    );
    console.log("Parámetros para calcularVigencia:", {
      parentesco: PARENTESCO,
      edad,
      vigenciaEstudios: VIGENCIA_ESTUDIOS,
      fechaNacimiento: F_NACIMIENTO,
      ESDISCAPACITADO,
    });
    console.log("Vigencia final:", vigencia);

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });

      if (!response.ok) throw new Error("Empleado no encontrado");

      const employeeData = await response.json();
      console.log("Datos del empleado obtenidos:", employeeData);

      const EMPLEADO_NOMBRE = employeeData?.nombre
        ? `${employeeData.nombre} ${employeeData.a_paterno || ""} ${
            employeeData.a_materno || ""
          }`.trim()
        : "N/A";
      const NUM_NOMINA = employeeData?.num_nom || "N/A";
      const DEPARTAMENTO = employeeData?.departamento || "N/A";

      console.log("Datos del empleado para carnet:", {
        EMPLEADO_NOMBRE,
        NUM_NOMINA,
        DEPARTAMENTO,
      });

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
        16.2,
        6.4
      ); // Nombre
      doc.text(parentescoDescripcion, 17, 7.9); // Parentesco
      doc.text(edadConAnios, 24, 7.9); // Edad
      doc.text(vigencia, 17, 9.7); // Vigencia
      
      doc.setFontSize(12);
      doc.text(EMPLEADO_NOMBRE, 16.2, 11.5); // Nombre del empleado
      doc.setFontSize(12);
      doc.text(NUM_NOMINA, 17, 13.1); // Número de nómina
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 10);
      doc.text(departamentoText, 17, 14.9); // Departamento

      // Aquí añadimos la firma en la sección "Secretario de Administración" **en la primera página**.
      // Ajusta la posición (x, y) y tamaño (width, height) según tu diseño.
      doc.addImage(signatureImage, "PNG", 20, 18, 4.5, 1.5);

      // Página Trasera
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);

      // Guardar el PDF
      doc.save(`Carnet_${NOMBRE}_${A_PATERNO}.pdf`);
      console.log("Carnet generado exitosamente");
    } catch (error) {
      console.error("Error al generar el carnet:", error.message);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo generar el carnet. Intenta nuevamente.",
        "error"
      );
    }
  };

  const handlePrintCredential = async (beneficiary) => {
    try {
      // Verificar que el beneficiario esté activo
      if (beneficiary.ACTIVO !== "A") {
        playSound(false);
        Swal.fire("Error", "El beneficiario no está activo.", "error");
        return;
      }
  
      // Desestructuramos usando "FIRMA" y la renombramos a "firma"
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
        FIRMA: firma, // Renombramos FIRMA a firma para usarla posteriormente
      } = beneficiary;
  
      console.log("Datos recibidos del beneficiario:", beneficiary);
  
      // Función para obtener la descripción del parentesco
      const getParentescoDescripcion = (parentescoId) => {
        const parentesco = parentescoOptions.find(
          (option) => option.ID_PARENTESCO === parentescoId
        );
        return parentesco ? parentesco.PARENTESCO : "Desconocido";
      };
  
      // Función para formatear fecha local
      const formatFechaLocal = (fecha) => {
        if (!fecha) return "";
        const dateParts = fecha.split("T")[0].split("-");
        const [year, month, day] = dateParts;
        return `${day}/${month}/${year}`;
      };
  
      const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
      const edad = calculateAge(F_NACIMIENTO);
      console.log("Descripción del parentesco:", parentescoDescripcion);
      console.log("Edad calculada:", edad);
  
      // Calcular vigencia
      const vigencia = calcularVigencia(
        PARENTESCO,
        edad,
        VIGENCIA_ESTUDIOS,
        F_NACIMIENTO,
        ESDISCAPACITADO
      );
      console.log("Vigencia final asignada:", vigencia);
  
      // Consumir la API para obtener datos del empleado
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });
      if (!response.ok) throw new Error("Empleado no encontrado");
      const employeeData = await response.json();
      const DEPARTAMENTO = employeeData?.departamento || "N/A";
      console.log("Datos del empleado obtenidos:", employeeData);
  
      // Configuración de jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: "a4",
      });
  
      // Cargar imágenes de la credencial
      const frontTemplate = await loadImageBase64("/CREDENCIAL_FRONTAL2.png");
      const backTemplate = await loadImageBase64("/CREDENCIAL_TRASERA.png");
      const signatureSecretary = await loadImageBase64("/firma.png"); // Firma del secretario
  
      // Página frontal
      doc.addImage(frontTemplate, "PNG", 0, 0, 29.7, 21);
  
      // Si existe foto del beneficiario, agregarla
      if (FOTO_URL) {
        try {
          const photo = await loadImageBase64(FOTO_URL);
          const photoX = 4.5;
          const photoY = 10.9;
          const photoWidth = 7.0;
          const photoHeight = 8.4;
          doc.addImage(photo, "JPEG", photoX, photoY, photoWidth, photoHeight);
          // Dibujar marco redondeado alrededor de la foto
          doc.setLineWidth(0.25);
          doc.setDrawColor(255, 255, 255);
          doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 0.3, 0.3, "S");
        } catch (error) {
          console.error("Error al cargar la foto del beneficiario:", error);
        }
      }
  
      // Texto en la página frontal
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#19456a");
      doc.setFontSize(21);
      if (NO_NOMINA) {
        doc.text(NO_NOMINA.toString(), 18.3, 9.5);
      } else {
        console.error("Error: NO_NOMINA no es válido:", NO_NOMINA);
      }
      doc.setFontSize(18);
      if (parentescoDescripcion) {
        doc.text(parentescoDescripcion, 19.8, 11.42);
      } else {
        console.error("Error: parentescoDescripcion no es válido:", parentescoDescripcion);
      }
      doc.setFontSize(15);
      const nombreCompleto = `${NOMBRE || ""} ${A_PATERNO || ""} ${A_MATERNO || ""}`;
      if (nombreCompleto.trim()) {
        doc.text(nombreCompleto, 18.4, 13.4);
      } else {
        console.error("Error: Nombre completo no es válido:", nombreCompleto);
      }
      doc.setFontSize(18);
      const edadTexto = `${edad} años`;
      if (edadTexto) {
        doc.text(edadTexto, 17.2, 15.5);
      } else {
        console.error("Error: Edad no es válida:", edadTexto);
      }
      doc.setFontSize(14.5);
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 8.5);
      let departamentoY = 16.8;
      departamentoText.forEach((line) => {
        if (line.trim()) {
          doc.text(line, 20, departamentoY);
          departamentoY += 0.6;
        } else {
          console.error("Error: Línea del texto del departamento no es válida:", line);
        }
      });
      doc.setFontSize(18);
      if (vigencia) {
        doc.text(vigencia, 18.8, 19.4);
      } else {
        console.error("Error: Vigencia no es válida:", vigencia);
      }
  
      // Página trasera
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);
      doc.setFontSize(18);
      const fechaNacimientoTexto = formatFechaLocal(F_NACIMIENTO);
      if (fechaNacimientoTexto) {
        doc.text(fechaNacimientoTexto, 12.5, 2.8);
      } else {
        console.error("Error: Fecha de nacimiento no es válida:", fechaNacimientoTexto);
      }
      doc.text(SANGRE || "Sin información", 9.8, 5);
      doc.text(ALERGIAS || "Sin información", 7.0, 7.6);
      doc.text(TEL_EMERGENCIA || "Sin información", 14, 9.8);
      doc.text(NOMBRE_EMERGENCIA || "Sin información", 13.1, 12);
  
      // Añadir la firma del secretario (más grande)
      // Se aumenta el tamaño: por ejemplo, de 4.5 x 1.5 a 6 x 2.5, manteniendo la posición original
      doc.addImage(signatureSecretary, "PNG", 18, 13.2, 6, 2.5);
  
      // Añadir la firma del beneficiario (más abajo)
      if (firma) {
        // 'firma' ya es una cadena base64 con el prefijo "data:image/png;base64,..."
        // Se ajusta la posición para bajarla: por ejemplo, y = 18 (en lugar de 5)
        doc.addImage(firma, "PNG", 5, 13, 9, 3);
      } else {
        console.warn("No se encontró la firma del beneficiario.");
      }
  
      // Guardar el PDF
      doc.save(`Credencial_${NOMBRE || ""}_${A_PATERNO || ""}.pdf`);
      console.log("Credencial generada exitosamente");
    } catch (error) {
      console.error("Error al generar la credencial:", error.message);
      playSound(false);
      Swal.fire("Error", "No se pudo generar la credencial. Intenta nuevamente.", "error");
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
      const updatedData = { ...prevData, [name]: value.trim() };

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
        const isHijo = Number(value) === 2; // Comparar correctamente con número
        const isMenor16 = prevData.edad < 16;

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
          updatedData.vigenciaEstudios = ""; // Limpiar vigencia si no aplica
        }
      }

      return updatedData;
    });
  };

  const handleViewBeneficiary = async (beneficiario) => {
    setSelectedBeneficiary(null); // Limpia el estado anterior
    try {
      if (beneficiario.ACTIVO !== "A") {
        playSound(false);
        Swal.fire("Error", "El beneficiario no está activo.", "error");
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
        playSound(false);
        Swal.fire("Error", data.error, "error");
      }
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
      playSound(false);
      Swal.fire(
        "Error",
        "No se pudo obtener la información del beneficiario.",
        "error"
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
            playSound(true);
            Swal.fire("Éxito", "Imagen subida correctamente.", "success");
          } else {
            playSound(false);
            Swal.fire(
              "Error",
              data.error || "No se pudo subir la imagen.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error al subir la imagen:", error);
          playSound(false);
          Swal.fire("Error", "Error al subir la imagen.", "error");
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

  function showEmployeeNotFoundAlert() {
    playSound(false);
    Swal.fire({
      title: "Empleado No Encontrado",
      text: "No se ha encontrado ningún empleado con ese número de nómina.",
      icon: "error",
      confirmButtonText: "Cerrar",
      background: "#2b2f3a",
      color: "#ffffff",
      confirmButtonColor: "#ff5722",
      customClass: {
        popup: "custom-swal-popup",
      },
    });
  }

  const handleBack = () => {
    router.push("/inicio-servicio-medico"); // Redirige a /inicio-servicio-medico
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
      console.log("Datos de beneficiarios desde la API:", data);

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
      playSound(false);
      Swal.fire("Error", "Por favor, ingresa el número de nómina.", "warning");
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

  const handleAddBeneficiary = () => {
    if (!empleado) {
      playSound(false);
      Swal.fire("Error", "Por favor, busca primero un empleado.", "warning");
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

    // 2. Validaciones genéricas de documentos
    if (!formData.urlActaNac) {
      return {
        success: false,
        message: "El Acta de Nacimiento es obligatoria.",
      };
    }
    if (!formData.urlCurp) {
      return { success: false, message: "La CURP es obligatoria." };
    }

    // 3. Ejemplo: Esposo(a) (ID 1)
    if (parentescoId === 1) {
      if (!formData.actaMatrimonioUrl) {
        return { success: false, message: "Falta el Acta de Matrimonio." };
      }
      if (!formData.ineUrl) {
        return { success: false, message: "Falta el INE." };
      }
      if (!formData.cartaNoAfiliacionUrl) {
        return { success: false, message: "Falta la Carta de No Afiliación." };
      }
    }

    // 4. Ejemplo: Concubino(a) (ID 3)
    if (parentescoId === 3) {
      if (!formData.actaConcubinatoUrl) {
        return { success: false, message: "Falta el Acta de Concubinato." };
      }
    }

    // Si todo está correcto
    return { success: true, message: "" };
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Llamamos a la función validateDocuments
    const { success, message } = validateDocuments(formData);
    if (!success) {
      playSound(false);
      Swal.fire("Error", message, "error");
      return; // Detenemos el proceso si falta algún documento obligatorio
    }

    console.log("Enviando formulario...");

    // Validar campos obligatorios según el backend
    if (
      (isEditMode && !currentBeneficiaryId) || // Validar idBeneficiario en modo edición
      !numNomina ||
      !formData.parentesco ||
      !formData.nombre ||
      !formData.sexo ||
      !formData.fNacimiento ||
      !formData.telEmergencia ||
      !formData.nombreEmergencia
    ) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los campos obligatorios deben completarse.",
      });
      return;
    }

    // ** Validar si ya existe un Padre o Madre registrado **
    try {
      const { conflict, message } = await validateUniqueParentesco(
        numNomina,
        formData.parentesco
      );

      if (conflict) {
        playSound(false);
        Swal.fire({
          icon: "error",
          title: "Conflicto detectado",
          text: message,
        });
        return;
      }
    } catch (error) {
      playSound(false);
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
      return;
    }

    // Validar la URL de la imagen
    if (!formData.imageUrl || !formData.imageUrl.startsWith("http")) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, sube una imagen válida.",
      });
      return;
    }

    // Validar constancia de estudios si aplica
    if (
      formData.esEstudiante &&
      (!formData.urlConstancia || !formData.urlConstancia.startsWith("http"))
    ) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, sube una constancia de estudios válida.",
      });
      return;
    }

    // Validar la URL del acta de concubinato (opcional)
    if (
      formData.actaConcubinatoUrl &&
      !formData.actaConcubinatoUrl.startsWith("http")
    ) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, sube un enlace válido para el acta de concubinato.",
      });
      return;
    }

    // Validar la URL del acta de incapacidad si aplica
    if (
      formData.esDiscapacitado &&
      (!formData.urlIncap || !formData.urlIncap.startsWith("http"))
    ) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, sube un acta de incapacidad válida.",
      });
      return;
    }

    // ** Validar relación exclusiva entre Esposo(a) y Concubino(a) **
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

      const validationData = await validationResponse.json();
      if (!validationResponse.ok) {
        throw new Error(validationData.message || "Error en la validación");
      }

      // Si existe un conflicto, detener el flujo
      if (validationData.conflict) {
        playSound(false);
        Swal.fire({
          icon: "error",
          title: "Conflicto detectado",
          text: validationData.message,
        });
        return;
      }
    } catch (error) {
      console.error(
        "Error durante la validación de parentesco:",
        error.message
      );
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
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
            return null; // Devuelve null si la fecha no es válida
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

        actaConcubinatoUrl: formData.actaConcubinatoUrl || null,
        urlIncap: formData.urlIncap || null,
        descriptorFacial: formData.descriptorFacial || "",
        firma: formData.firma, // <-- Aquí

      };

      console.log("Datos enviados al backend (antes del fetch):", payload);

      // Realizar la solicitud al backend
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Validar respuesta del backend
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
      console.log("Respuesta del backend:", responseData);

      playSound(true);
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: isEditMode
          ? "Beneficiario actualizado correctamente."
          : "Beneficiario registrado correctamente.",
      });

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
        urlIncap: "", // Reseteo del campo URL_INCAP
      });

      setIsModalOpen(false);
      fetchBeneficiarios(); // Refrescar lista de beneficiarios
    } catch (error) {
      console.error("Error al enviar el formulario:", error.message);
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  //EDITAR BENEFICIAROS//
  const handleEditBeneficiary = (beneficiario) => {
    // Formatear fechas
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

    // Calcular la edad a partir de la fecha de nacimiento
    const edad = calculateAge(new Date(beneficiario.F_NACIMIENTO));

    // Determinar el tipo de parentesco
    const isHijo = beneficiario.PARENTESCO === 2; // Hijo(a) tiene ID 2
    const isPadreOMadre =
      beneficiario.PARENTESCO === 4 || beneficiario.PARENTESCO === 5; // Padre (4) o Madre (5)
    const isEsposo = beneficiario.PARENTESCO === 1; // Esposo(a) tiene ID 1
    const isConcubino = beneficiario.PARENTESCO === 3; // Concubino(a) tiene ID 3

    // Actualizar los datos en el formulario
    setFormData({
      parentesco: beneficiario.PARENTESCO || "",
      nombre: beneficiario.NOMBRE || "",
      aPaterno: beneficiario.A_PATERNO || "",
      aMaterno: beneficiario.A_MATERNO || "",
      sexo: beneficiario.SEXO || "",
      fNacimiento: formatFecha(beneficiario.F_NACIMIENTO) || "",
      edad, // Edad calculada
      alergias: beneficiario.ALERGIAS || "",
      sangre: beneficiario.SANGRE?.toUpperCase().trim() || "", // Normaliza y limpia el valor
      telEmergencia: beneficiario.TEL_EMERGENCIA || "",
      nombreEmergencia: beneficiario.NOMBRE_EMERGENCIA || "",
      activo: beneficiario.ACTIVO || "A",
      vigenciaEstudios: beneficiario.VIGENCIA_ESTUDIOS
        ? formatDateTimeLocal(beneficiario.VIGENCIA_ESTUDIOS)
        : "",
      imageUrl: beneficiario.FOTO_URL || "",
      esEstudiante: Number(beneficiario.ESESTUDIANTE) === 1, // Convertir a booleano
      esDiscapacitado: Number(beneficiario.ESDISCAPACITADO) === 1, // Convertir a booleano
      urlConstancia: beneficiario.URL_CONSTANCIA || "",
      urlActaNac: beneficiario.URL_ACTA_NAC || "", // Acta de Nacimiento
      urlCurp: beneficiario.URL_CURP || "", // CURP
      actaMatrimonioUrl: beneficiario.URL_ACTAMATRIMONIO || "", // Acta de Matrimonio
      ineUrl: beneficiario.URL_INE || "", // INE
      cartaNoAfiliacionUrl: beneficiario.URL_NOISSTE || "", // Carta de No Afiliación
      actaConcubinatoUrl: beneficiario.URL_CONCUBINATO || "", // Acta de Concubinato
      urlIncap: beneficiario.URL_INCAP || "", // Nuevo campo: Acta de Incapacidad
      showCheckboxes: isHijo && edad >= 16, // Mostrar checkboxes si es Hijo(a) y tiene >= 16 años
      showUploadFiles: isHijo || isPadreOMadre || isEsposo || isConcubino, // Mostrar inputs para archivos si aplica
      showEsposoFiles: isEsposo, // Mostrar campos específicos de Esposo(a)
      showConcubinoFiles: isConcubino, // Mostrar campos específicos de Concubino(a)
      descriptorFacial: beneficiario.DESCRIPTOR_FACIAL || "", // <-- Nuevo
    });

    setCurrentBeneficiaryId(beneficiario.ID_BENEFICIARIO);
    setIsEditMode(true); // Activar modo edición
    setIsModalOpen(true); // Abrir modal
  };

  useEffect(() => {}, [formData]);

  // Función para ver los datos del beneficiario
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Función para confirmar y eliminar beneficiario
  const handleDeleteBeneficiary = (idBeneficiario) => {
    playSound(false);
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará al beneficiario y su imagen asociada. No se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/beneficiarios/eliminarBeneficiario`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idBeneficiario }), // Enviar el ID del beneficiario al backend
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "No se pudo eliminar el beneficiario."
            );
          }

          playSound(true);
          Swal.fire(
            "Eliminado",
            "El beneficiario y su imagen asociada han sido eliminados correctamente.",
            "success"
          );

          fetchBeneficiarios(); // Refresca la lista de beneficiarios después de eliminar
        } catch (error) {
          playSound(false);
          Swal.fire("Error", error.message, "error");
        }
      }
    });
  };

  /** */
  /**TERMINO DE LA FUNCION */

  return (

    
    <div className={styles.body}>
      <div className={styles.bannerContainer}>
        <Image
          src="/baner_sjr.png"
          alt="Banner"
          width={1100} // Asegúrate de definir un ancho
          height={150} // y altura para la imagen
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
              urlIncap: "", // Nuevo campo para el archivo de incapacidad
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
                      const selectedId = e.target.value;
                      const selectedOption = parentescoOptions.find(
                        (option) =>
                          String(option.ID_PARENTESCO) === String(selectedId)
                      );
                      const selectedParentescoText = selectedOption
                        ? selectedOption.PARENTESCO
                        : "";

                      // Verificar tipo de parentesco
                      const isHijo = selectedParentescoText === "Hijo(a)";
                      const isPadreOMadre =
                        selectedParentescoText === "Padre" ||
                        selectedParentescoText === "Madre";
                      const isEsposo = selectedParentescoText === "Esposo(a)";
                      const isConcubino =
                        selectedParentescoText === "Concubino(a)"; // Nuevo caso

                      setFormData((prev) => ({
                        ...prev,
                        parentesco: selectedId,
                        showUploadFiles:
                          isHijo || isPadreOMadre || isEsposo || isConcubino, // Mostrar inputs para estos casos
                        showEsposoFiles: isEsposo, // Mostrar campos específicos de Esposo(a)
                        showConcubinoFiles: isConcubino, // Mostrar campo específico para Concubino(a)
                        showCheckboxes: isHijo && prev.edad >= 16, // Checkboxes solo para Hijo(a) mayor o igual a 16 años
                        esEstudiante: 0,
                        esDiscapacitado: 0,
                        actaNacimientoUrl: "",
                        curpFileUrl: "",
                        actaConcubinatoUrl: "", // Limpia el nuevo campo
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
                        onClick={() => {
                          if (formData.urlActaNac) {
                            window.open(formData.urlActaNac, "_blank");
                          } else {
                            playSound(false);
                            Swal.fire(
                              "Error",
                              "No se encontró un Acta de Nacimiento válida.",
                              "error"
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
                        onClick={() => {
                          if (formData.urlCurp) {
                            window.open(formData.urlCurp, "_blank");
                          } else {
                            playSound(false);
                            Swal.fire(
                              "Error",
                              "No se encontró un CURP válido.",
                              "error"
                            );
                          }
                        }}
                      >
                        Ver CURP Actual
                      </button>
                    )}
                  </div>
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
                                  playSound(false);
                                  Swal.fire(
                                    "Error",
                                    "Por favor, ingresa un número de nómina válido.",
                                    "error"
                                  );
                                  return;
                                }

                                try {
                                  console.log(
                                    `[INFO] Solicitando acta de matrimonio para nómina: ${numNomina}`
                                  );

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
                                  console.log(
                                    "[DEBUG] Respuesta de la API:",
                                    result
                                  );

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

                                  playSound(true);
                                  Swal.fire(
                                    "Éxito",
                                    "Acta de Matrimonio cargada correctamente.",
                                    "success"
                                  );
                                } catch (error) {
                                  console.error(
                                    "[ERROR] Error al cargar el acta de matrimonio:",
                                    error.message
                                  );
                                  playSound(false);
                                  Swal.fire("Error", error.message, "error");
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
                            onClick={() => {
                              if (formData.ineUrl) {
                                window.open(formData.ineUrl, "_blank");
                              } else {
                                playSound(false);
                                Swal.fire(
                                  "Error",
                                  "No se encontró un INE válido.",
                                  "error"
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
                            onClick={() => {
                              if (formData.cartaNoAfiliacionUrl) {
                                window.open(
                                  formData.cartaNoAfiliacionUrl,
                                  "_blank"
                                );
                              } else {
                                playSound(false);
                                Swal.fire(
                                  "Error",
                                  "No se encontró una Carta de No Afiliación válida.",
                                  "error"
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
                            console.error(
                              "[ERROR] Número de nómina no ingresado."
                            );
                            playSound(false);
                            Swal.fire(
                              "Error",
                              "Por favor, ingresa un número de nómina válido.",
                              "error"
                            );
                            return;
                          }

                          try {
                            console.log(
                              `[INFO] Solicitando acta de concubinato para nómina: ${numNomina}`
                            );
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
                            console.log("[DEBUG] Respuesta de la API:", result);

                            if (!response.ok) {
                              console.error(
                                "[ERROR] API Error:",
                                result.message
                              );
                              throw new Error(result.message);
                            }

                            // Actualizar el estado con la URL
                            setFormData((prev) => ({
                              ...prev,
                              actaConcubinatoUrl: result.url,
                            }));

                            playSound(true);
                            Swal.fire(
                              "Éxito",
                              "Acta de Concubinato cargada correctamente.",
                              "success"
                            );
                          } catch (error) {
                            console.error(
                              "[ERROR] Error al cargar el acta:",
                              error.message
                            );
                            playSound(false);
                            Swal.fire("Error", error.message, "error");
                          }
                        }}
                        className={styles.uploadButton3}
                      >
                        Cargar Acta de Concubinato
                      </button>

                      {/* Pequeño botón-ícono para subir manualmente el PDF */}
                      <button
                        type="button"
                        className={styles.iconButton} // Aplica un estilo reducido o inline
                        onClick={() => {
                          // Disparamos un click a un input "oculto" que sube PDF
                          const fileInput = document.getElementById(
                            "acta-concubinato-manual-upload"
                          );
                          if (fileInput) fileInput.click();
                        }}
                        title="Subir manualmente (PDF)"
                      >
                        <FaFileAlt />
                      </button>

                      {/* Input oculto para subir manualmente la Acta de Concubinato */}
                      <input
                        type="file"
                        id="acta-concubinato-manual-upload"
                        name="actaConcubinatoManual"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileUploadActaConcubinatoManual}
                      />

                      {/* Nombre del archivo subido (automático o manual) */}
                      <span className={styles.fileName2}>
                        {formData.actaConcubinatoUrl
                          ? getFileNameFromURL(formData.actaConcubinatoUrl)
                          : "Sin archivo cargado"}
                      </span>
                    </div>
                  </label>

                  {/* Botón "ver" en caso de que ya exista un archivo subido */}
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
              )}

              {/* Checkboxes dinámicos */}
              {formData.showCheckboxes && (
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
                        console.log(
                          "Checkbox 'Es Discapacitado' actualizado:",
                          isChecked
                        );

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
                      onClick={() => {
                        if (formData.urlIncap) {
                          window.open(formData.urlIncap, "_blank");
                        } else {
                          playSound(false);
                          Swal.fire(
                            "Error",
                            "No se encontró un Acta de Incapacidad válida.",
                            "error"
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
                      type="datetime-local"
                      name="vigenciaEstudios"
                      value={formData.vigenciaEstudios}
                      onChange={handleVigenciaChange} // Validación incluida aquí
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
                      onClick={() => {
                        if (formData.urlConstancia) {
                          window.open(formData.urlConstancia, "_blank");
                        } else {
                          playSound(false);
                          Swal.fire(
                            "Error",
                            "No se encontró una constancia válida.",
                            "error"
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

           
      {/* El botón que abre la firma */}
      <button type="button" onClick={handleOpenFirma}>
        Firma
      </button>

      {/* Un modal (o similar) para dibujar la firma */}
      {isFirmaOpen && (
        <div style={{ border: "1px solid #ccc", padding: "10px" }}>
          <h3>Firme en el recuadro:</h3>
          <SignatureCanvas
            ref={signatureRef}
            backgroundColor="transparent" // Fondo transparente
            penColor="black"             // Color del lápiz
            canvasProps={{
              width: 500,
              height: 200,
              style: { border: "1px dashed #000" },
            }}
          />
          <div>
            <button onClick={handleClearFirma}>Limpiar</button>
            <button onClick={handleSaveFirma}>Guardar Firma</button>
          </div>
        </div>
      )}
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
              
            </fieldset>

            {/* Botones */}
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={`${styles.submitButton} ${
                  isSaveDisabled ? styles.disabled : ""
                }`}
                disabled={isSaveDisabled} // Botón deshabilitado si la fecha es inválida
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
                    {new Date(
                      selectedBeneficiary.F_NACIMIENTO
                    ).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </li>
                  <li>
                    <strong>Edad:</strong>{" "}
                    {calculateAge(new Date(selectedBeneficiary.F_NACIMIENTO))}
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
                      playSound(false);
                      Swal.fire(
                        "Error",
                        "No se pudo generar el carnet. Intenta nuevamente.",
                        "error"
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
