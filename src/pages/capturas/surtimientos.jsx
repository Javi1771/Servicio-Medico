import React, { useState, useEffect } from "react";
import useFetchConsulta from "../../hooks/surtimientosHook/useFetchConsulta";
import useFetchEmpleado from "../../hooks/surtimientosHook/useFetchEmpleado";
import styles from "../css/estilosSurtimientos/surtimientos.module.css";
import MedicamentosForm from "./components/medicamentosForm";
import TablaResultados from "./components/TablaResultados";
import Cookies from "js-cookie"; // Asegúrate de tener instalada esta librería
import Swal from "sweetalert2";
import { FiInfo } from "react-icons/fi";
import Image from "next/image";


export default function Surtimientos() {
  const [folioConsulta, setFolioConsulta] = useState("");
  const [claveNomina, setClaveNomina] = useState(null);
  const [sindicato, setSindicato] = useState("");
  const [medico, setMedico] = useState(null); // Información del médico

  // Declara los estados
  const [detalles, setDetalles] = useState([]); // Estado para detalles

  const [nombreMedico, setNombreMedico] = useState("");
  const [claveEspecialidad, setClaveEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadNombre, setEspecialidadNombre] = useState("No registrada");

  const { data, error, loading, fetchConsulta } = useFetchConsulta();
  const { empleadoData, fetchEmpleado } = useFetchEmpleado();

  const [diagnosticoEditable, setDiagnosticoEditable] = useState("");

  const [isSearchAttempted, setIsSearchAttempted] = useState(false);

  const [isDiagnosticoEditable, setIsDiagnosticoEditable] = useState(true);

    const [costo, setCosto] = useState("");
    const [claveusuario, setClaveusuario] = useState("");
  

  // Manejar la búsqueda del folio de consulta
  const handleSearch = async () => {
    setIsSearchAttempted(true); // Marcar que se hizo un intento de búsqueda

    if (!folioConsulta.trim()) {
      Swal.fire({
        title: "Campo Vacío",
        text: "Por favor, ingresa un folio de consulta.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    try {
      // Mostrar SweetAlert de carga
      Swal.fire({
        title: "Cargando...",
        text: "Por favor, espera mientras se carga la consulta.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Simular espera de 1.5 segundos antes de proceder
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 1. Obtener detalles de la receta
      const detallesResponse = await fetch(
        `/api/surtimientos/getDetallesReceta?folioReceta=${folioConsulta}`
      );

      if (!detallesResponse.ok) {
        Swal.fire({
          title: "Error al Cargar Detalles",
          text: "No se pudieron obtener los detalles de la receta.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
        return; // Salimos de la función si falla la petición
      }

      const detallesData = await detallesResponse.json();
      console.log("Detalles obtenidos:", detallesData);
      setDetalles(detallesData);

      // 2. Obtener información adicional usando tu hook existente
      const consultaData = await fetchConsulta(folioConsulta);

      if (consultaData) {
        setClaveNomina(consultaData.clavenomina);
        setSindicato(consultaData.sindicato);
        setMedico({
          nombre: consultaData.medico,
          especialidad: consultaData.especialidad,
        });
        setClaveEspecialidad(consultaData.especialidad);

        // Inicializar el diagnóstico editable si no existe
        setDiagnosticoEditable(consultaData.diagnostico || "");

        // Validar si el diagnóstico ya existe
        setIsDiagnosticoEditable(!consultaData.diagnostico); // No editable si ya tiene valor
      }

      // Cerrar SweetAlert cuando todo se completa correctamente
      Swal.close();
    } catch (error) {
      console.error("Error al buscar información:", error.message);

      // Simular espera de 1.5 segundos antes de mostrar el error
      setTimeout(() => {
        Swal.fire({
          title: "Error al Buscar Información",
          text: "Ocurrió un problema al buscar el folio. Por favor, intenta de nuevo.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }, 500);
      // Limpiar los estados cuando hay un error
      setClaveNomina(null);
      setEmpleadoData(null);
      setSindicato("");
      setMedico(null);
      setDetalles([]);
      setDiagnosticoEditable("");
    }
  };

  useEffect(() => {
    if (claveNomina) {
      fetchEmpleado(claveNomina);
    }
  }, [claveNomina, fetchEmpleado]);

  // Leer cookies al cargar
  useEffect(() => {
    const nombre = Cookies.get("nombreusuario");
    const clave = Cookies.get("claveespecialidad");
    console.log("Nombre Médico desde cookies:", nombre);
    console.log("Clave Especialidad desde cookies:", clave);
    setNombreMedico(nombre || "No especificado");
    setClaveEspecialidad(clave || "No especificado");

    const costo = Cookies.get("costo");
    console.log("Costo: ", costo);
    setCosto(costo || "No especificado");

    const claveusuario = Cookies.get("claveusuario");
    console.log("Clave claveusuario: ", claveusuario);
    setClaveusuario(claveusuario || "No especificado");
  }, []);

  // Fetch para obtener especialidades
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch("/api/surtimientos/getEspecialidades");
        const data = await response.json();
        const normalizedData = data.map((item) => ({
          ...item,
          claveespecialidad: parseInt(item.claveespecialidad, 10),
        }));
        console.log("Especialidades cargadas:", normalizedData);
        setEspecialidades(normalizedData);
      } catch (error) {
        console.error("Error al cargar las especialidades:", error);
      }
    };

    fetchEspecialidades();
  }, []);

  // Interpretar la claveEspecialidad
  useEffect(() => {
    if (claveEspecialidad && especialidades.length > 0) {
      const especialidadEncontrada = especialidades.find(
        (esp) => esp.claveespecialidad === parseInt(claveEspecialidad, 10)
      );
      console.log("Especialidad encontrada:", especialidadEncontrada);
      setEspecialidadNombre(
        especialidadEncontrada?.especialidad || "No registrada"
      );
    }
  }, [claveEspecialidad, especialidades]);

  useEffect(() => {
    console.log("Estado detalles actualizado:", detalles);
  }, [detalles]);

  useEffect(() => {
    // Muestra SweetAlert en caso de error
    if (error) {
      Swal.fire({
        title: "Error",
        text: `Ocurrió un problema: ${error}`,
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  }, [error]);

  useEffect(() => {
    // Muestra SweetAlert mientras está cargando
    if (loading) {
      Swal.fire({
        title: "Cargando...",
        text: "Por favor, espera mientras se carga la consulta.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }
  }, [loading]);


  return (
    <div className={styles.bodyContainer}>
      <div className={styles.container}>
        {/* Banner en la parte superior */}
        <div className={styles.bannerContainer}>
          <Image
            src="/baner_sjr.png" // Ruta de tu imagen
            alt="Banner Superior"
            width={1920} // Ajusta según el ancho del contenedor
            height={200} // Ajusta la altura
            priority // Carga la imagen de forma prioritaria
            className={styles.bannerImage}
          />
        </div>
        <h1 className={styles.title}>Surtimientos</h1>
        {/* Header */}
        <div className={styles.customHeader}>
          <div className={styles.customSearchSection}>
            <input
              type="text"
              id="folioConsulta"
              value={folioConsulta}
              onChange={(e) => setFolioConsulta(e.target.value)}
              placeholder="Folio de consulta"
              className={styles.customInput}
            />
            <button
              onClick={handleSearch}
              className={styles.customSearchButton}
            >
              Buscar
            </button>
          </div>
          <span className={styles.customDate}>
            Fecha Actual: {new Date().toLocaleDateString("es-ES")}
          </span>

          <div className={styles.customMedicoInfo}>
            <p>
              <span>Nombre del Médico:</span> {nombreMedico}
            </p>
            <p>
              <span>Clave Especialidad:</span> {claveEspecialidad}
            </p>
          </div>
        </div>

        {/* Renderizar solo si se ha intentado buscar */}
        {isSearchAttempted &&
          (empleadoData || sindicato || detalles.length > 0 ? (
            <>
              {/* Información del empleado */}
              {empleadoData && (
                <>
                  <h2 className={styles.employeeTitle}>
                    Información del Empleado
                  </h2>
                  <div className={styles.employeeCard}>
                    <p>
                      <strong>Número de Nómina:</strong>{" "}
                      {claveNomina || "No disponible"}
                    </p>
                    <p>
                      <strong>Nombre:</strong>{" "}
                      {`${empleadoData.nombre || "No disponible"} ${
                        empleadoData.a_paterno || ""
                      } ${empleadoData.a_materno || ""}`}
                    </p>
                  </div>
                </>
              )}

              {/* Sección del Paciente y Sindicato */}
              {(empleadoData || sindicato) && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Información del Paciente y Sindicato
                  </h2>

                  <div className={styles.row}>
                    {/* Información del paciente */}
                    {empleadoData && (
                      <div
                        className={`${styles.cardContainer} ${styles.cardt}`}
                      >
                        <h3 className={styles.cardSubtitle}>
                          Información del Paciente
                        </h3>
                        <p>
                          <strong>Paciente:</strong>{" "}
                          {data?.nombrepaciente || "No disponible"}
                        </p>
                        <p>
                          <strong>Edad:</strong>{" "}
                          {empleadoData?.edad || "No disponible"} años
                        </p>
                        <p>
                          <strong>Departamento:</strong>{" "}
                          {empleadoData?.departamento || "No disponible"}
                        </p>
                        <p>
                          <strong>Parentesco:</strong>{" "}
                          {data?.parentesco || "No disponible"}
                        </p>
                      </div>
                    )}

                    {/* Información de sindicato */}
                    <div
                      className={`${styles.sindicatoCard} ${styles.cardt} ${
                        sindicato
                          ? styles.sindicalizado
                          : styles.noSindicalizado
                      }`}
                    >
                      <h3 className={styles.cardSubtitle}>Sindicato</h3>
                      <p>
                        <strong>Estado:</strong>{" "}
                        {sindicato ? "Sindicalizado" : "No Sindicalizado"}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {sindicato || "No registrado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información del médico especialista */}
              {medico && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle2}>
                    Información del Especialista
                  </h2>
                  <div className={styles.medicoCard}>
                    <h3>Médico Especialista</h3>
                    <div className={styles.medicoInfo}>
                      <div className={styles.medicoDetails}>
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {medico.nombre || "No disponible"}
                        </p>
                        <p>
                          <strong>Especialidad:</strong>{" "}
                          {especialidadNombre || "No registrada"}
                        </p>
                      </div>

                      <div className={styles.diagnosticoField}>
                        <label htmlFor="diagnostico">
                          <strong>Diagnóstico:</strong>
                        </label>
                        <textarea
                          id="diagnostico"
                          className={styles.diagnosticoTextarea}
                          value={diagnosticoEditable}
                          onChange={(e) =>
                            setDiagnosticoEditable(e.target.value)
                          }
                          placeholder="Escribe el diagnóstico..."
                          disabled={!isDiagnosticoEditable} // Deshabilitado si ya existe diagnóstico
                        />

                        <p
                          className={`${styles.infoMessage} ${
                            isDiagnosticoEditable
                              ? styles.successMessage
                              : styles.errorMessage
                          }`}
                        >
                          <FiInfo className={styles.infoIcon} />
                          {!isDiagnosticoEditable
                            ? "El diagnóstico ya existe y no puede ser modificado."
                            : "Puedes escribir un diagnóstico."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario */}
              {medico && (
                <MedicamentosForm
                  folioConsulta={folioConsulta}
                  diagnostico={diagnosticoEditable}
                  onFormSubmitted={handleSearch}
                  detalles={detalles}
                />
              )}

              {/* Tabla de Resultados */}
              {detalles.length > 0 && (
              <TablaResultados
              folioPase={folioConsulta} // Se asegura de pasar el folio correcto
              data={detalles}
              onEstatusUpdated={handleSearch}
            />
            
              )}
            </>
          ) : (
            // Mostrar el mensaje si no hay datos
            <p className={styles.noDataMessage}>
              No hay información disponible. Introduce un folio válido y busca.
            </p>
          ))}
      </div>
    </div>
  );
}
