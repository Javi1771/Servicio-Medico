/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import Modal from "react-modal";
import styles from "../css/beneficiarios.module.css";
import { useRouter } from "next/router";
import { jsPDF } from "jspdf";

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
    edad: "", // Añadimos el campo edad
    fNacimiento: "",
    alergias: "",
    sangre: "",
    telEmergencia: "",
    nombreEmergencia: "",
    activo: "A", // Campo de estado del beneficiario (A=Activo, I=Inactivo)
    imageUrl: "", // URL de la imagen en Cloudinary
    vigencia: "", // Añadir el campo de vigencia
    curp: "", // Nuevo campo CURP
    situacion_lab: "", // Nuevo campo de situación laboral
    enfermedades_cronicas: "", // Inicialización del campo enfermedades_cronicas
    tratamientos: "", // Nuevo campo tratamientos
    domicilio: "", // Nuevo campo domicilio
    observaciones: "", // Nuevo campo observaciones
    esEstudiante: "No", // Default value
    vigenciaEstudiosInicio: "",
    vigenciaEstudiosFin: "",
    esDiscapacitado: "No", // Añadido campo discapacitado, valor predeterminado "No"
  });

  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBeneficiaryId, setCurrentBeneficiaryId] = useState(null);
  const [isOtherEnabled, setIsOtherEnabled] = useState(false); // Nueva variable de estado

  const router = useRouter(); // Define el router usando useRouter

  const handleGenerateCard = async (beneficiary) => {
    const {
      NO_NOMINA,
      PARENTESCO,
      NOMBRE,
      A_PATERNO,
      A_MATERNO,
      EDAD,
      VIGENCIA,
    } = beneficiary;

    // Verificar si las opciones de parentesco están disponibles
    if (!parentescoOptions || parentescoOptions.length === 0) {
      console.error("Opciones de parentesco no disponibles.");
      Swal.fire(
        "Error",
        "No se pudieron cargar las opciones de parentesco. Intenta nuevamente.",
        "error"
      );
      return;
    }

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    // Formatear fechas al formato DD/MM/YYYY
    const formatFecha = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // Interpretación del parentesco
    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edadConAnios = `${EDAD || 0} años`;

    try {
      // Consumir la API del web service para obtener datos del empleado
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          num_nom: NO_NOMINA,
        }),
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
      doc.setTextColor("#19456a"); // Azul oscuro

      // Colocar texto en el carnet
      doc.setFontSize(14);
      doc.text(
        `${NOMBRE || ""} ${A_PATERNO || ""} ${A_MATERNO || ""}`,
        18.5,
        6.0
      ); // Nombre del Beneficiario
      doc.text(parentescoDescripcion, 18.5, 7.5); // Parentesco
      doc.text(edadConAnios, 24, 7.6); // Edad
      doc.text(formatFecha(VIGENCIA), 18.5, 8.8); // Vigencia

      doc.text(EMPLEADO_NOMBRE, 18.5, 10.5); // Nombre del Empleado
      doc.text(NUM_NOMINA, 18.5, 11.6); // Número de Nómina
      // Ajustar el texto del departamento en caso de que sea largo
      const departamentoText = doc.splitTextToSize(DEPARTAMENTO, 10); // Ajusta el ancho máximo del texto
      // Renderizar el texto en múltiples líneas
      doc.text(departamentoText, 18.5, 12.8);

      // Página Trasera del Carnet
      doc.addPage();
      doc.addImage(backTemplate, "PNG", 0, 0, 29.7, 21);

      // Guardar el archivo PDF
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

  /**FUNCION PARA IMPRIMIR LA CREDENCIAL */
  const handlePrintCredential = async (beneficiary) => {
    const {
      NO_NOMINA,
      PARENTESCO,
      NOMBRE,
      A_PATERNO,
      A_MATERNO,
      EDAD,
      DEPARTAMENTO,
      VIGENCIA,
      F_NACIMIENTO,
      TEL_EMERGENCIA,
      NOMBRE_EMERGENCIA,
      FOTO_URL,
      SANGRE,
      ALERGIAS,
    } = beneficiary;

    // Validar si las opciones de parentesco están disponibles
    if (!parentescoOptions || parentescoOptions.length === 0) {
      console.error("Parentesco options no disponibles.");
      Swal.fire(
        "Error",
        "No se pudieron cargar las opciones de parentesco. Intenta nuevamente.",
        "error"
      );
      return;
    }

    // Función para obtener la descripción del parentesco
    const getParentescoDescripcion = (parentescoId) => {
      const parentesco = parentescoOptions.find(
        (option) => option.ID_PARENTESCO === parentescoId
      );
      return parentesco ? parentesco.PARENTESCO : "Desconocido";
    };

    const parentescoDescripcion = getParentescoDescripcion(PARENTESCO);
    const edadConAnios = `${EDAD || 0}  AÑOS`;

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
        doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 0.3, 0.3, "S");
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
    doc.text(doc.splitTextToSize(DEPARTAMENTO || "", 8.5), 21.3, 15.4);

    doc.setFontSize(18);
    doc.text(formatFecha(VIGENCIA), 18.8, 19.0);

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
      const updatedData = { ...prevData, [name]: value };

      // Limpiar vigenciaEstudios si esEstudiante es "No" y mantener el valor si es "Sí"
      if (name === "esEstudiante") {
        updatedData.vigenciaEstudios =
          value === "Sí" ? prevData.vigenciaEstudios : "N/A";
      }

      // Calcular edad automáticamente al actualizar la fecha de nacimiento
      if (name === "fNacimiento") {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        updatedData.edad = age;
      }

      return updatedData;
    });
  };

  const handleViewBeneficiary = async (beneficiario) => {
    try {
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

  // Cambiar el estado activo/inactivo
  const toggleStatus = () => {
    // Alternar entre "A" y "I" para el estado de activo/inactivo usando formData.activo
    setFormData((prevData) => ({
      ...prevData,
      activo: prevData.activo === "A" ? "I" : "A",
    }));
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
      const response = await fetch(
        `/api/mostBeneficiarios?num_nom=${numNomina}`
      );
      const data = await response.json();
      console.log("Datos de beneficiarios desde la API:", data); // Asegúrate de que `CURP` está presente
      setBeneficiarios(data);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
    }
  }, [numNomina]);

  // Ejecuta fetchBeneficiarios solo cuando el empleado cambia
  useEffect(() => {
    if (empleado) {
      fetchBeneficiarios();
    }
  }, [empleado, fetchBeneficiarios]); // <--- Modificado, se agrega fetchBeneficiarios como dependencia

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

  /*const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };*/

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
    setIsEditMode(false); // Establecer en modo agregar (registro)
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Convertir la fecha de nacimiento al formato ISO 8601
    const formattedDate = new Date(formData.fNacimiento).toISOString();

    // Cambia el endpoint y método según el modo (registro o edición)
    const endpoint = isEditMode
      ? "/api/editarBeneficiario"
      : "/api/crearBeneficiario";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fNacimiento: formattedDate, // Asegúrate de enviar la fecha correctamente
          idBeneficiario: currentBeneficiaryId, // Solo se usa en modo edición
          ...formData,
          noNomina: numNomina,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo procesar la solicitud.");
      }

      Swal.fire(
        "Éxito",
        isEditMode
          ? "Beneficiario editado correctamente."
          : "Beneficiario registrado correctamente.",
        "success"
      );

      // Reinicia el modal y el estado
      setIsModalOpen(false);
      setIsEditMode(false);
      setCurrentBeneficiaryId(null);
      setFormData({
        parentesco: "",
        nombre: "",
        aPaterno: "",
        aMaterno: "",
        sexo: "",
        edad: "",
        fNacimiento: "",
        alergias: "",
        sangre: "",
        telEmergencia: "",
        nombreEmergencia: "",
        activo: "A",
        imageUrl: "",
        vigencia: "",
        curp: "",
        situacion_lab: "",
        enfermedades_cronicas: "",
        tratamientos: "",
        domicilio: "",
        observaciones: "",
      });
      fetchBeneficiarios();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  // Función para editar beneficiario existente
  const handleEditBeneficiary = (beneficiario) => {
    console.log("Beneficiario recibido para edición:", beneficiario);
    console.log("Situación laboral:", beneficiario.situacion_lab); // Depuración

    const formatFecha = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    };

    const calcularEdad = (fechaNacimiento) => {
      if (!fechaNacimiento) return "";
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    };

    setFormData({
      parentesco: beneficiario.PARENTESCO || "",
      nombre: beneficiario.NOMBRE || "",
      aPaterno: beneficiario.A_PATERNO || "",
      aMaterno: beneficiario.A_MATERNO || "",
      sexo: beneficiario.SEXO || "",
      fNacimiento: formatFecha(beneficiario.F_NACIMIENTO) || "",
      edad: calcularEdad(beneficiario.F_NACIMIENTO) || "",
      alergias: beneficiario.ALERGIAS || "",
      sangre: beneficiario.SANGRE || "",
      telEmergencia: beneficiario.TEL_EMERGENCIA || "",
      nombreEmergencia: beneficiario.NOMBRE_EMERGENCIA || "",
      activo: beneficiario.ACTIVO || "A",
      curp: beneficiario.CURP || "",
      situacion_lab: beneficiario.situacion_lab || "",
      enfermedades_cronicas: beneficiario.enfermedades_cronicas || "",
      tratamientos: beneficiario.tratamientos || "",
      domicilio: beneficiario.domicilio || "",
      observaciones: beneficiario.observaciones || "",
      esEstudiante: beneficiario.ESESTUDIANTE || "No",
      vigenciaEstudiosInicio:
        formatFecha(beneficiario.VIGENCIA_ESTUDIOS_INICIO) || "",
      vigenciaEstudiosFin: formatFecha(beneficiario.VIGENCIA_ESTUDIOS_FIN) || "",
      esDiscapacitado: beneficiario.ESDISCAPACITADO || "No",
    });
    

    setCurrentBeneficiaryId(beneficiario.ID_BENEFICIARIO);
    setIsEditMode(true);
    setIsModalOpen(true);
    console.log("Beneficiario recibido para edición:", beneficiario);
  };

  useEffect(() => {}, [formData]);

  // Función para ver los datos del beneficiario
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Función para confirmar y eliminar beneficiario
  const handleDeleteBeneficiary = (idBeneficiario) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
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
            body: JSON.stringify({ idBeneficiario }),
          });

          if (!response.ok) {
            throw new Error("No se pudo eliminar el beneficiario.");
          }

          Swal.fire(
            "Eliminado",
            "El beneficiario ha sido eliminado correctamente.",
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

        {/* Modal para agregar beneficiario */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => {
            setIsModalOpen(false);
            setIsEditMode(false);

            // Restablece solo si no estás editando
            setFormData({
              parentesco: "",
              nombre: "",
              aPaterno: "",
              aMaterno: "",
              sexo: "",
              fNacimiento: "",
              alergias: "",
              sangre: "",
              telEmergencia: "",
              nombreEmergencia: "",
              activo: "A",
              vigencia: "",
              curp: "",
              situacion_lab: "",
              enfermedades_cronicas: "",
              tratamientos: "",
              domicilio: "",
              observaciones: "",
              esEstudiante: "No",
              vigenciaEstudiosInicio: "",
              vigenciaEstudiosFin: "",
              esDiscapacitado: "No",
            });
          }}
          overlayClassName={styles.modalOverlay}
          className={styles.modal}
        >
          <form onSubmit={handleModalSubmit} className={styles.beneficiaryForm}>
            <h2>
              {isEditMode ? "Editar Beneficiario" : "Registrar Beneficiario"}
            </h2>
            <button
              type="button"
              onClick={toggleStatus}
              className={`${styles.statusButton} ${
                formData.activo === "A" ? styles.active : styles.inactive
              }`}
            >
              {formData.activo === "A" ? "Activo" : "Inactivo"}
            </button>

            {/* Fila 1: Foto */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Foto:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 2: Parentesco y Nombre */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Parentesco:
                  <select
                    name="parentesco"
                    value={formData.parentesco}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
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
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nombre:
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 3: Apellido Paterno y Apellido Materno */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Apellido Paterno:
                  <input
                    type="text"
                    name="aPaterno"
                    value={formData.aPaterno}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Apellido Materno:
                  <input
                    type="text"
                    name="aMaterno"
                    value={formData.aMaterno}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 4: Fecha de Nacimiento y Edad */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Fecha de Nacimiento:
                  <input
                    type="date"
                    name="fNacimiento"
                    value={formData.fNacimiento}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Edad:
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    readOnly
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 5: Sexo y Alergias */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Sexo:
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  >
                    <option value="">Selecciona</option>
                    {sexoOptions.map((option) => (
                      <option key={option.idSexo} value={option.idSexo}>
                        {option.sexo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Alergias:
                  <input
                    type="text"
                    name="alergias"
                    value={formData.alergias}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 6: Vigencia y Tipo de Sangre */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Vigencia:
                  <input
                    type="date"
                    name="vigencia"
                    value={formData.vigencia}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Tipo de Sangre:
                  <input
                    type="text"
                    name="sangre"
                    value={formData.sangre}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 7: CURP */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  CURP:
                  <input
                    type="text"
                    name="curp"
                    value={formData.curp} // Verifica que formData.curp tenga el valor correcto
                    onChange={handleInputChange}
                    required
                    maxLength="18"
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 8: Situación Laboral */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Situación Laboral:</label>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="radio"
                      name="situacion_lab"
                      value="Pensionado"
                      checked={formData.situacion_lab === "Pensionado"}
                      onChange={handleInputChange}
                    />
                    Pensionado
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="situacion_lab"
                      value="Jubilado"
                      checked={formData.situacion_lab === "Jubilado"}
                      onChange={handleInputChange}
                    />
                    Jubilado
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="situacion_lab"
                      value="N/A"
                      checked={formData.situacion_lab === "N/A"}
                      onChange={handleInputChange}
                    />
                    N/A
                  </label>
                </div>
              </div>
            </div>

            {/* Fila 9: Enfermedades Crónicas */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>
                  <input
                    type="radio"
                    name="enfermedades_cronicas"
                    value="Diabetico"
                    checked={formData.enfermedades_cronicas === "Diabetico"}
                    onChange={handleInputChange}
                  />
                  Diabetico
                </label>
                <label>
                  <input
                    type="radio"
                    name="enfermedades_cronicas"
                    value="Hipertenso"
                    checked={formData.enfermedades_cronicas === "Hipertenso"}
                    onChange={handleInputChange}
                  />
                  Hipertenso
                </label>
                <label>
                  <input
                    type="radio"
                    name="enfermedades_cronicas"
                    value="Cancer"
                    checked={formData.enfermedades_cronicas === "Cancer"}
                    onChange={handleInputChange}
                  />
                  Cancer
                </label>
                <label>
                  <input
                    type="radio"
                    name="enfermedades_cronicas"
                    value="Otro"
                    checked={formData.enfermedades_cronicas === "Otro"}
                    onChange={(e) => {
                      handleInputChange(e);
                      setIsOtherEnabled(e.target.value === "Otro");
                    }}
                  />
                  Otro
                </label>
                {isOtherEnabled && (
                  <input
                    type="text"
                    name="enfermedades_cronicas"
                    value={
                      formData.enfermedades_cronicas !== "Diabetico" &&
                      formData.enfermedades_cronicas !== "Hipertenso" &&
                      formData.enfermedades_cronicas !== "Cancer"
                        ? formData.enfermedades_cronicas
                        : ""
                    }
                    onChange={handleInputChange}
                    placeholder="Especifique otra enfermedad"
                    className={styles.inputField}
                  />
                )}
              </div>
            </div>

            {/* Fila 10: Tratamientos y Observaciones */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Tratamientos:
                  <textarea
                    name="tratamientos"
                    value={formData.tratamientos}
                    onChange={(e) =>
                      setFormData({ ...formData, tratamientos: e.target.value })
                    }
                    placeholder="Especifica tratamientos"
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Observaciones:
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value,
                      })
                    }
                    placeholder="Añadir observaciones"
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            {/* Fila 11: Domicilio */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Domicilio:
                  <input
                    type="text"
                    name="domicilio"
                    value={formData.domicilio}
                    onChange={(e) =>
                      setFormData({ ...formData, domicilio: e.target.value })
                    }
                    placeholder="Ingrese el domicilio"
                    className={styles.inputField}
                  />
                </label>
              </div>

              {/* Campo de Estudiante y Vigencia de Estudios */}
              <label className={styles.inputLabel}>
                ¿Es estudiante?
                <select
                  name="esEstudiante"
                  value={formData.esEstudiante}
                  onChange={handleInputChange}
                  className={styles.inputField}
                >
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </label>

              {formData.esEstudiante === "Sí" && (
                <div className={styles.inputRow}>
                  <label className={styles.inputLabel}>
                    Vigencia de Estudios (Inicio):
                    <input
                      type="date"
                      name="vigenciaEstudiosInicio"
                      value={formData.vigenciaEstudiosInicio}
                      onChange={handleInputChange}
                      className={styles.inputField}
                    />
                  </label>
                  <label className={styles.inputLabel}>
                    Vigencia de Estudios (Fin):
                    <input
                      type="date"
                      name="vigenciaEstudiosFin"
                      value={formData.vigenciaEstudiosFin}
                      onChange={handleInputChange}
                      className={styles.inputField}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Fila: Es Discapacitado */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  ¿Es Discapacitado?
                  <select
                    name="esDiscapacitado"
                    value={formData.esDiscapacitado}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Fila 12: Nombre y Teléfono de Emergencia */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nombre de Emergencia:
                  <input
                    type="text"
                    name="nombreEmergencia"
                    value={formData.nombreEmergencia}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Teléfono de Emergencia:
                  <input
                    type="text"
                    name="telEmergencia"
                    value={formData.telEmergencia}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              {isEditMode ? "Guardar Cambios" : "Guardar Beneficiario"}
            </button>
          </form>
        </Modal>

        {/*INFORMACION DEL BENEFICIARIO */}
        <Modal
          isOpen={isViewModalOpen}
          onRequestClose={() => setIsViewModalOpen(false)}
          overlayClassName={styles.modalOverlay}
          className={styles.modal}
        >
          {selectedBeneficiary && (
            <div className={styles.card}>
              <h2>Información del Beneficiario</h2>
              <p>
                <strong>ID:</strong> {selectedBeneficiary.ID_BENEFICIARIO}
              </p>
              <p>
                <strong>Número de Nómina:</strong>{" "}
                {selectedBeneficiary.NO_NOMINA}
              </p>
              {/* Mostrar la descripción de parentesco */}
              <p>
                <strong>Parentesco:</strong>{" "}
                {parentescoOptions.find(
                  (p) => p.ID_PARENTESCO === selectedBeneficiary.PARENTESCO
                )?.PARENTESCO || "Desconocido"}
              </p>
              <p>
                <strong>Nombre:</strong>{" "}
                {`${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`}
              </p>
              {/* Mostrar la descripción de sexo */}
              <p>
                <strong>Sexo:</strong>{" "}
                {sexoOptions.find(
                  (s) => String(s.idSexo) === String(selectedBeneficiary.SEXO)
                )?.sexo || "Desconocido"}
              </p>
              {/* Mostrar el Departamento */}
              <p>
                <strong>Departamento:</strong>{" "}
                {selectedBeneficiary.DEPARTAMENTO || "N/A"}
              </p>
              <p>
                <strong>Fecha de Nacimiento:</strong>{" "}
                {selectedBeneficiary.F_NACIMIENTO}
              </p>
              {/* Mostrar la Edad */}
              <p>
                <strong>Edad:</strong> {selectedBeneficiary.EDAD || "N/A"}
              </p>
              <p>
                <strong>Activo:</strong>{" "}
                {selectedBeneficiary.ACTIVO === "A" ? "Sí" : "No"}
              </p>
              <p>
                <strong>Alergias:</strong>{" "}
                {selectedBeneficiary.ALERGIAS || "Ninguna"}
              </p>
              <p>
                <strong>Tipo de Sangre:</strong>{" "}
                {selectedBeneficiary.SANGRE || "N/A"}
              </p>
              <p>
                <strong>Teléfono de Emergencia:</strong>{" "}
                {selectedBeneficiary.TEL_EMERGENCIA || "N/A"}
              </p>
              <p>
                <strong>Nombre de Contacto de Emergencia:</strong>{" "}
                {selectedBeneficiary.NOMBRE_EMERGENCIA || "N/A"}
              </p>
              {/* Mostrar si el beneficiario es estudiante */}
              {selectedBeneficiary.ESESTUDIANTE === "Sí" && (
                <>
                  <p>
                    <strong>Vigencia de Estudios (Inicio):</strong>{" "}
                    {selectedBeneficiary.VIGENCIA_ESTUDIOS_INICIO
                      ? new Date(
                          selectedBeneficiary.VIGENCIA_ESTUDIOS_INICIO
                        ).toLocaleDateString("es-ES")
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Vigencia de Estudios (Fin):</strong>{" "}
                    {selectedBeneficiary.VIGENCIA_ESTUDIOS_FIN
                      ? new Date(
                          selectedBeneficiary.VIGENCIA_ESTUDIOS_FIN
                        ).toLocaleDateString("es-ES")
                      : "N/A"}
                  </p>
                </>
              )}
              <p>
                <strong>CURP:</strong> {selectedBeneficiary.CURP || "N/A"}
              </p>
              <p>
                <strong>Sindicato:</strong>{" "}
                {selectedBeneficiary.SINDICATO || "N/A"}
              </p>
              <p>
                <strong>Situación Laboral:</strong>{" "}
                {selectedBeneficiary.situacion_lab || "N/A"}
              </p>{" "}
              <p>
                <strong>Enfermedades Crónicas:</strong>{" "}
                {selectedBeneficiary.enfermedades_cronicas || "N/A"}
              </p>
              <p>
                <strong>Tratamientos:</strong>{" "}
                {selectedBeneficiary.tratamientos || "N/A"}
              </p>
              <p>
                <strong>Domicilio:</strong>{" "}
                {selectedBeneficiary.domicilio || "N/A"}
              </p>
              <p>
                <strong>Observaciones:</strong>{" "}
                {selectedBeneficiary.observaciones || "N/A"}
              </p>
              {/* Mostrar situación laboral */}
              <p>
                <strong>Vigencia:</strong>{" "}
                {selectedBeneficiary.VIGENCIA
                  ? new Date(selectedBeneficiary.VIGENCIA).toLocaleDateString(
                      "es-ES",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : "N/A"}
              </p>
              {/* Mostrar si el beneficiario es discapacitado */}
              <p>
                <strong>Discapacitado:</strong>{" "}
                {selectedBeneficiary.ESDISCAPACITADO || "N/A"}
              </p>
              {/* Mostrar la imagen solo si FOTO_URL está disponible */}
              {selectedBeneficiary.FOTO_URL ? (
                <div className={styles.imageContainer}>
                  <Image
                    src={selectedBeneficiary.FOTO_URL}
                    alt={`${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO}`}
                    width={200} // Ajusta el ancho según tus necesidades
                    height={200} // Ajusta el alto según tus necesidades
                    className={styles.beneficiaryImage}
                  />
                </div>
              ) : (
                <p>Imagen no disponible</p>
              )}
              <button
                onClick={() => handlePrintCredential(selectedBeneficiary)}
                className={styles.printButton}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zm-7-9h5v2h-5zm0 4h5v2h-5zM7 8h5v2H7zm0 4h5v2H7zm0 4h5v2H7z" />
                </svg>
                Imprimir Credencial
              </button>
              <button
                onClick={async () => {
                  try {
                    // Llamar directamente a la función handleGenerateCard
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
                className={styles.printButton}
              >
                Imprimir Carnet
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className={styles.closeButton}
              >
                Cerrar
              </button>
            </div>
          )}
        </Modal>

        {/* Tabla de beneficiarios, solo se muestra si el empleado es encontrado */}
        {empleado && beneficiarios.length > 0 && (
          <div className={styles.tableContainer}>
            <h2>Beneficiarios Registrados</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>No. Nómina</th>
                  <th>Parentesco</th>
                  <th>Nombre</th>
                  <th>Apellido Paterno</th>
                  <th>Apellido Materno</th>
                  <th>Fecha de Nacimiento</th>
                  <th>Estatus</th>
                  <th>Alergias</th>
                  <th>Tipo de Sangre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {beneficiarios.map((beneficiario) => {
                  // Encuentra el nombre de parentesco y sexo correspondiente usando find//
                  const parentesco = parentescoOptions.find(
                    (option) => option.ID_PARENTESCO === beneficiario.PARENTESCO
                  );

                  return (
                    <tr key={beneficiario.ID_BENEFICIARIO}>
                      <td>{beneficiario.ID_BENEFICIARIO}</td>
                      <td>{beneficiario.NO_NOMINA}</td>
                      <td>{parentesco ? parentesco.PARENTESCO : "N/A"}</td>
                      <td>{beneficiario.NOMBRE}</td>
                      <td>{beneficiario.A_PATERNO}</td>
                      <td>{beneficiario.A_MATERNO}</td>
                      <td>{beneficiario.F_NACIMIENTO}</td>
                      <td>
                        {beneficiario.ACTIVO === "A" ? "Activo" : "Inactivo"}
                      </td>
                      <td>{beneficiario.ALERGIAS}</td>
                      <td>{beneficiario.SANGRE}</td>

                      <td>
                        <button
                          onClick={() => handleEditBeneficiary(beneficiario)}
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
                          onClick={() => handleViewBeneficiary(beneficiario)}
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
