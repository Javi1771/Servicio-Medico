import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import Modal from "react-modal";
import styles from "../css/beneficiarios.module.css";
import { useRouter } from "next/router";
import { jsPDF } from "jspdf";

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
  });

  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBeneficiaryId, setCurrentBeneficiaryId] = useState(null);
  const router = useRouter(); // Define el router usando useRouter
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Estado para deshabilitar el botón de guardar
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);

  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleCloseModal = () => {
    setIsFadingOut(true); // Activamos la animación de salida
    setTimeout(() => {
      setIsFadingOut(false); // Reseteamos el estado después del fadeOut
      setIsDocumentsModalOpen(false); // Cerramos el modal
    }, 300); // La duración del fadeOut debe coincidir con la animación CSS
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
          ineUrl: data.url, // Guardar la URL correcta
        }));
      } else {
        Swal.fire(
          "Error",
          "Error al subir el INE. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el INE:", error);
      Swal.fire("Error", "No se pudo subir el INE.", "error");
    }
  };

  const handleFileUploadActaMatrimonio = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/beneficiarios/uploadActaMatrimonio", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Acta de Matrimonio subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          actaMatrimonioUrl: data.url, // Guardar la URL correcta
        }));
      } else {
        Swal.fire(
          "Error",
          "Error al subir el Acta de Matrimonio. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta de Matrimonio:", error);
      Swal.fire("Error", "No se pudo subir el Acta de Matrimonio.", "error");
    }
  };

  const handleFileUploadCartaNoAfiliacion = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

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
        Swal.fire(
          "Error",
          "Error al subir la Carta de No Afiliación. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la Carta de No Afiliación:", error);
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
          urlCurp: data.url, // Guardar la URL correcta
        }));
      } else {
        Swal.fire(
          "Error",
          "Error al subir la CURP. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir la CURP:", error);
      Swal.fire("Error", "No se pudo subir la CURP.", "error");
    }
  };

  const handleFileUploadActa = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/beneficiarios/uploadActa", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Acta subida exitosamente:", data.url);
        setFormData((prev) => ({
          ...prev,
          urlActaNac: data.url, // Cambiar a `urlActaNac` para coincidir con la API
        }));
      } else {
        Swal.fire(
          "Error",
          "Error al subir el Acta. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el Acta:", error);
      Swal.fire("Error", "No se pudo subir el Acta.", "error");
    }
  };

  //SUBIR DOCUMENTO DE CONSTANCIA DE ESTUDIOS//
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploadConstancia", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Archivo subido exitosamente:", data.url);

        // Guardar la URL pública en el estado
        setFormData((prev) => ({
          ...prev,
          urlConstancia: data.url, // Guardar la URL pública del archivo
          fileName: file.name, // Guardar el nombre del archivo
        }));
      } else {
        Swal.fire(
          "Error",
          "Error al subir el archivo. Intenta nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      Swal.fire("Error", "No se pudo subir el archivo.", "error");
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
    // Verificar que el beneficiario esté activo
    if (beneficiary.ACTIVO !== "A") {
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
      VIGENCIA_ESTUDIOS, // Cambiado de VIGENCIA
    } = beneficiary;

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edadConAnios = `${calculateAge(F_NACIMIENTO)} años`; // Edad calculada

    try {
      // Consumir la API del web service para obtener datos del empleado
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });

      if (!response.ok) throw new Error("Empleado no encontrado");

      const employeeData = await response.json();

      // Datos del empleado
      const EMPLEADO_NOMBRE = employeeData?.nombre
        ? `${employeeData.nombre} ${employeeData.a_paterno || ""} ${
            employeeData.a_materno || ""
          }`.trim()
        : "N/A";
      const NUM_NOMINA = employeeData?.num_nom || "N/A";
      const DEPARTAMENTO = employeeData?.departamento || "N/A";

      // Configuración para jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: "a4",
      });

      // Cargar las imágenes del carnet
      const frontTemplateUrl = `/CARNET_FRONTAL.png`;
      const backTemplateUrl = `/CARNET_FRONTAL2.png`;

      const frontTemplate = await loadImageBase64(frontTemplateUrl);
      const backTemplate = await loadImageBase64(backTemplateUrl);

      // Página Frontal del Carnet
      doc.addImage(frontTemplate, "PNG", 0, 0, 29.7, 21);

      doc.setFont("helvetica", "bold");
      doc.setTextColor("#19456a");

      // Colocar texto en el carnet
      doc.setFontSize(14);
      doc.text(
        `${NOMBRE || ""} ${A_PATERNO || ""} ${A_MATERNO || ""}`,
        18.5,
        6.0
      ); // Nombre del Beneficiario
      doc.text(parentescoDescripcion, 18.5, 7.5); // Parentesco
      doc.text(edadConAnios, 24, 7.6); // Edad
      doc.text(formatFecha(VIGENCIA_ESTUDIOS), 18.5, 8.8); // Vigencia

      doc.text(EMPLEADO_NOMBRE, 18.5, 10.5); // Nombre del Empleado
      doc.text(NUM_NOMINA, 18.5, 11.6); // Número de Nómina
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 10);
      doc.text(departamentoText, 18.5, 12.8); // Departamento

      // Página Trasera del Carnet
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);

      doc.save(`Carnet_${NOMBRE}_${A_PATERNO}.pdf`);
    } catch (error) {
      console.error("Error al generar el carnet:", error.message);
      Swal.fire(
        "Error",
        "No se pudo generar el carnet. Intenta nuevamente.",
        "error"
      );
    }
  };

  const handlePrintCredential = async (beneficiary) => {
    // Verificar que el beneficiario esté activo
    if (beneficiary.ACTIVO !== "A") {
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
      VIGENCIA_ESTUDIOS, // Cambiado de VIGENCIA
      TEL_EMERGENCIA,
      NOMBRE_EMERGENCIA,
      FOTO_URL,
      SANGRE,
      ALERGIAS,
    } = beneficiary;

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edadConAnios = `${calculateAge(F_NACIMIENTO)} años`; // Edad calculada

    try {
      // Consumir la API del web service para obtener datos del empleado
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: NO_NOMINA }),
      });

      if (!response.ok) throw new Error("Empleado no encontrado");

      const employeeData = await response.json();

      const DEPARTAMENTO = employeeData?.departamento || "N/A";

      // Configuración para jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: "a4",
      });

      // Cargar las imágenes de la credencial
      const frontTemplateUrl = `/CREDENCIAL_FRONTAL2.png`;
      const backTemplateUrl = `/CREDENCIAL_TRASERA.png`;

      const frontTemplate = await loadImageBase64(frontTemplateUrl);
      const backTemplate = await loadImageBase64(backTemplateUrl);

      // Página Frontal
      doc.addImage(frontTemplate, "PNG", 0, 0, 29.7, 21);

      // Añadir la foto y el marco redondeado
      if (FOTO_URL) {
        try {
          const photo = await loadImageBase64(FOTO_URL);
          const photoX = 4.5;
          const photoY = 10.9;
          const photoWidth = 7.0;
          const photoHeight = 8.4;

          // Añadir la foto
          doc.addImage(photo, "JPEG", photoX, photoY, photoWidth, photoHeight);

          // Añadir un marco redondeado alrededor de la foto
          doc.setLineWidth(0.25);
          doc.setDrawColor(255, 255, 255); // Color del marco (blanco)
          doc.roundedRect(
            photoX,
            photoY,
            photoWidth,
            photoHeight,
            0.3,
            0.3,
            "S"
          );
        } catch (error) {
          console.error("Error al cargar la foto del beneficiario:", error);
        }
      }

      // Texto en la página frontal
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#19456a"); // Azul

      doc.setFontSize(21);
      doc.text(NO_NOMINA?.toString() || "", 18.3, 9.5);

      doc.setFontSize(18);
      doc.text(parentescoDescripcion, 19.8, 11.16);

      doc.setFontSize(15);
      doc.text(
        `${NOMBRE || ""} ${A_PATERNO || ""} ${A_MATERNO || ""}`,
        18.4,
        12.6
      );

      doc.setFontSize(18);
      doc.text(edadConAnios, 17.2, 14.3);

      doc.setFontSize(14.5);
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 8.5); // Ajustar texto largo
      let departamentoY = 15.4;
      departamentoText.forEach((line) => {
        doc.text(line, 21.3, departamentoY);
        departamentoY += 0.6; // Ajustar el espaciado entre líneas
      });

      doc.setFontSize(18);
      doc.text(formatFecha(VIGENCIA_ESTUDIOS), 18.8, 19.0);

      // Página Trasera
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);

      doc.setFontSize(18);
      doc.text(formatFecha(F_NACIMIENTO), 12.5, 2.8);
      doc.text(SANGRE || "", 9.8, 5.2);
      doc.text(ALERGIAS || "", 7.0, 7.6);
      doc.text(TEL_EMERGENCIA || "", 14, 9.8);
      doc.text(NOMBRE_EMERGENCIA || "", 13.1, 12);

      // Guardar como PDF
      doc.save(`Credencial_${NOMBRE || ""}_${A_PATERNO || ""}.pdf`);
    } catch (error) {
      console.error("Error al generar la credencial:", error.message);
      Swal.fire(
        "Error",
        "No se pudo generar la credencial. Intenta nuevamente.",
        "error"
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
      const updatedData = { ...prevData, [name]: value.trim() }; // Remover espacios adicionales
  
      // Validar el campo CURP
      if (name === "curp") {
        if (value.length > 18) {
          setCurpError("El CURP debe tener un máximo de 18 caracteres");
        } else if (value.length < 18) {
          setCurpError("El CURP debe tener exactamente 18 caracteres");
        } else {
          setCurpError("");
        }
      }
  
      // Calcular la edad si cambia la fecha de nacimiento
      if (name === "fNacimiento") {
        const birthDate = new Date(value);
        const age = calculateAge(birthDate);
        updatedData.edad = age;
  
        // Revalidar checkboxes basados en el nuevo valor de edad
        updateCheckboxState(age, updatedData.parentesco);
      }
  
      // Revalidar checkboxes si cambia el parentesco
      if (name === "parentesco") {
        updateCheckboxState(updatedData.edad, value);
      }
  
      // Validar y normalizar el valor del tipo de sangre
      if (name === "sangre") {
        updatedData.sangre = value.toUpperCase(); // Convertir a mayúsculas para asegurar compatibilidad
      }
  
      return updatedData;
    });
  
    // Añadir o eliminar la clase 'hasText' según corresponda
    if (value) {
      e.target.classList.add(styles.hasText);
    } else {
      e.target.classList.remove(styles.hasText);
    }
  };
  

  const updateCheckboxState = (edad, parentescoId) => {
    const isHijo = parentescoId === "2"; // "Hijo(a)" tiene ID 2
    const isMayorOIgual16 = edad >= 16;

    setFormData((prev) => ({
      ...prev,
      showCheckboxes: isHijo && isMayorOIgual16,
      esEstudiante: 0, // Reinicia "esEstudiante"
      esDiscapacitado: 0, // Reinicia "esDiscapacitado"
    }));
  };

  const handleViewBeneficiary = async (beneficiario) => {
    setSelectedBeneficiary(null); // Limpia el estado anterior
    try {
      if (beneficiario.ACTIVO !== "A") {
        Swal.fire("Error", "El beneficiario no está activo.", "error");
        return;
      }

      const response = await fetch(
        `/api/getBeneficiary?idBeneficiario=${beneficiario.ID_BENEFICIARIO}`
      );
      const data = await response.json();

      if (response.ok) {
        setSelectedBeneficiary(data);
        setIsViewModalOpen(true);
      } else {
        console.error("Error fetching beneficiary:", data.error);
        Swal.fire("Error", data.error, "error");
      }
    } catch (error) {
      console.error("Error fetching beneficiary:", error);
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
          const response = await fetch("/api/uploadImage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }),
          });

          const data = await response.json();
          if (data.imageUrl) {
            // Actualizar el estado con la URL de la imagen subida
            setFormData({ ...formData, imageUrl: data.imageUrl });
          }
        } catch (error) {
          console.error("Error al subir la imagen:", error);
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
    router.back(); // Navegar a la página anterior en el historial
  };

  // Función para obtener las opciones de sexo desde la API
  const fetchSexoOptions = async () => {
    try {
      const response = await fetch("/api/sexo");
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
        `/api/mostBeneficiarios?num_nom=${numNomina}`
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
      const response = await fetch("/api/parentescos");
      const data = await response.json();
      setParentescoOptions(data);
    } catch (err) {
      console.error("Error fetching parentesco options:", err);
    }
  };

  const handleSearch = async () => {
    if (!numNomina) {
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
        urlActanac: "", // Nuevo: Limpia la URL del acta de nacimiento
        urlCurp: "", // Nuevo: Limpia la URL del CURP
        actaMatrimonioUrl: "", // Limpia la URL del acta de matrimonio
        ineUrl: "", // Limpia la URL del INE
        cartaNoAfiliacionUrl: "", // Limpia la URL de la carta de no afiliación
      });

      // Establecer el modal en modo registro y abrirlo
      setIsEditMode(false);
      setIsModalOpen(true);
    }, 0); // Asegura que el estado se limpie correctamente antes de abrir
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    console.log("Enviando formulario...");

    // Validaciones de los campos necesarios
    if (!formData.imageUrl || !formData.imageUrl.startsWith("http")) {
      Swal.fire("Error", "Por favor, sube una imagen válida.", "error");
      return;
    }

    if (
      formData.esEstudiante &&
      (!formData.urlConstancia || !formData.urlConstancia.startsWith("http"))
    ) {
      Swal.fire(
        "Error",
        "Por favor, sube una constancia de estudios válida.",
        "error"
      );
      return;
    }

    // Formatear las fechas
    const formattedNacimiento = formData.fNacimiento
      ? new Date(formData.fNacimiento).toISOString()
      : null;

    const formattedVigenciaEstudios = formData.vigenciaEstudios
      ? new Date(formData.vigenciaEstudios).toISOString()
      : null;

    const endpoint = isEditMode
      ? "/api/editarBeneficiario"
      : "/api/crearBeneficiario";
    const method = isEditMode ? "PUT" : "POST";

    try {
      // Depurar formData antes de enviarlo
      console.log("Datos enviados al backend (antes del fetch):", {
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
      });

      // Realizar la solicitud al backend
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Intentar obtener más detalles del error
        console.error("Error del backend:", errorData);
        throw new Error(
          isEditMode
            ? "Error al actualizar el beneficiario."
            : "Error al registrar el beneficiario."
        );
      }

      Swal.fire(
        "Éxito",
        isEditMode
          ? "Beneficiario actualizado correctamente."
          : "Beneficiario registrado correctamente.",
        "success"
      );

      // Resetear el formulario después de guardar o actualizar
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
        actaMatrimonioUrl: "", // Resetear Acta de Matrimonio
        ineUrl: "", // Resetear INE
        cartaNoAfiliacionUrl: "", // Resetear Carta de No Afiliación
      });

      setIsModalOpen(false);
      fetchBeneficiarios();
    } catch (error) {
      console.error("Error al enviar el formulario:", error.message);
      Swal.fire("Error", error.message, "error");
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
      showCheckboxes: isHijo && edad >= 16, // Mostrar checkboxes si es Hijo(a) y tiene >= 16 años
      showUploadFiles: isHijo || isPadreOMadre || isEsposo, // Mostrar inputs para archivos si aplica
      showEsposoFiles: isEsposo, // Mostrar campos específicos de Esposo(a)
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
          const response = await fetch(`/api/eliminarBeneficiario`, {
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

          Swal.fire(
            "Eliminado",
            "El beneficiario y su imagen asociada han sido eliminados correctamente.",
            "success"
          );

          fetchBeneficiarios(); // Refresca la lista de beneficiarios después de eliminar
        } catch (error) {
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
            onChange={(e) => setNumNomina(e.target.value)}
            className={styles.searchInput}
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

                      const isHijo = selectedParentescoText === "Hijo(a)";
                      const isPadreOMadre =
                        selectedParentescoText === "Padre" ||
                        selectedParentescoText === "Madre";
                      const isEsposo = selectedParentescoText === "Esposo(a)";

                      setFormData((prev) => ({
                        ...prev,
                        parentesco: selectedId,
                        showUploadFiles: isHijo || isPadreOMadre || isEsposo, // Mostrar inputs de archivo para Esposo(a), Hijo(a), Padre, Madre
                        showEsposoFiles: isEsposo, // Mostrar campos exclusivos de Esposo(a)
                        showCheckboxes: isHijo && prev.edad >= 16, // Checkboxes solo para Hijo(a) mayor o igual a 16 años
                        esEstudiante: 0,
                        esDiscapacitado: 0,
                        actaNacimientoUrl: "",
                        curpFileUrl: "",
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
                          <FaFileUpload className={styles.icon} /> Acta de
                          Matrimonio - SUBIR:
                          <div className={styles.fileInputWrapper2}>
                            <input
                              type="file"
                              name="actaMatrimonio"
                              accept="application/pdf"
                              onChange={handleFileUploadActaMatrimonio}
                              className={styles.fileInput2}
                              id="acta-matrimonio-upload"
                            />
                            <label
                              htmlFor="acta-matrimonio-upload"
                              className={styles.uploadButton2}
                            >
                              Seleccionar archivo
                            </label>
                            <span className={styles.fileName2}>
                              {formData.actaMatrimonioUrl
                                ? getFileNameFromURL(formData.actaMatrimonioUrl)
                                : "Sin archivo seleccionado"}
                            </span>
                          </div>
                        </label>

                        {formData.actaMatrimonioUrl && (
                          <button
                            type="button"
                            className={styles.viewButton2}
                            onClick={() => {
                              if (formData.actaMatrimonioUrl) {
                                window.open(
                                  formData.actaMatrimonioUrl,
                                  "_blank"
                                );
                              } else {
                                Swal.fire(
                                  "Error",
                                  "No se encontró un Acta de Matrimonio válida.",
                                  "error"
                                );
                              }
                            }}
                          >
                            Ver Acta de Matrimonio Actual
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
                          esDiscapacitado: false,
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
                        setFormData((prev) => ({
                          ...prev,
                          esDiscapacitado: e.target.checked,
                          esEstudiante: false,
                          vigenciaEstudios: "",
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

            {/*Subir Foto */}
            <div className={styles.inputRow}>
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
            {formData.imageUrl && (
              <div className={styles.imagePreview}>
                <Image
                  src={formData.imageUrl}
                  alt="Vista previa de la foto"
                  width={150} // Ajusta el ancho según sea necesario
                  height={150} // Ajusta la altura según sea necesario
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
                className={styles.submitButton}
                disabled={isSaveDisabled} // Botón deshabilitado si la fecha es inválida
              >
                <FaSave className={`${styles.icon} ${styles.iconLarge}`} />{" "}
                {isEditMode ? "Actualizar" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.cancelButton}
              >
                <FaTimes className={`${styles.icon} ${styles.iconLarge}`} />{" "}
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
                    <strong>CURP:</strong> {selectedBeneficiary.CURP}
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
            onClick={() => window.open(selectedBeneficiary.URL_CURP, "_blank")}
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
              window.open(selectedBeneficiary.URL_ACTAMATRIMONIO, "_blank")
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
            onClick={() => window.open(selectedBeneficiary.URL_INE, "_blank")}
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
