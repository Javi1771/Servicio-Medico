/* eslint-disable @typescript-eslint/no-unused-vars */
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

  const { empleadoData, fetchEmpleado } = useFetchEmpleado();

  const [diagnosticoEditable, setDiagnosticoEditable] = useState("");

  const [isSearchAttempted, setIsSearchAttempted] = useState(false);

  const [isDiagnosticoEditable, setIsDiagnosticoEditable] = useState(true);

  const [claveusuario, setClaveusuario] = useState("");

  //const para mostrar informacion del medico especialista

 
  const { data, fetchConsulta, error, loading } = useFetchConsulta();
  const [showHistorial, setShowHistorial] = useState(false);

  const handleToggleHistorial = () => {
    setShowHistorial(!showHistorial);
  };

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
      Swal.fire({
        title: "Cargando...",
        text: "Por favor, espera mientras se carga la consulta.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

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
        return;
      }

      const detallesData = await detallesResponse.json();
      setDetalles(detallesData);

      // 2. Obtener información del folio de consulta
      const consultaData = await fetchConsulta(folioConsulta);

      if (consultaData) {
        setClaveNomina(consultaData.clavenomina);
        setSindicato(consultaData.sindicato);

        let medicoNombre = "No disponible";
        let especialidadNombre = "No registrada";

        try {
          // 3. Consultar el especialista
          if (consultaData.claveproveedor) {
            const especialistaResponse = await fetch(
              `/api/surtimientos/getEspecialista?claveProveedor=${consultaData.claveproveedor}`
            );

            if (especialistaResponse.ok) {
              const especialistaData = await especialistaResponse.json();
              medicoNombre = especialistaData.nombreusuario || "No disponible";

              if (especialistaData.claveespecialidad) {
                const especialidadResponse = await fetch(
                  `/api/surtimientos/getEspecialidad?claveEspecialidad=${especialistaData.claveespecialidad}`
                );

                if (especialidadResponse.ok) {
                  const especialidadData = await especialidadResponse.json();
                  especialidadNombre =
                    especialidadData.especialidad || "No registrada";
                }
              }
            }
          }
        } catch (especialistaError) {
          console.warn(
            "Error al obtener especialista o especialidad:",
            especialistaError.message
          );
        }

        setMedico({
          nombre: medicoNombre,
          especialidad: especialidadNombre,
        });

        setDiagnosticoEditable(consultaData.diagnostico || "");
        setIsDiagnosticoEditable(!consultaData.diagnostico);
      }

      Swal.close();
    } catch (error) {
      console.error("Error al buscar información:", error.message);
      Swal.fire({
        title: "Error al Buscar Información",
        text: "Ocurrió un problema al buscar el folio. Por favor, intenta de nuevo.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      setClaveNomina(null);
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
  
    const claveusuario = Cookies.get("claveusuario");
    console.log("Clave claveusuario: ", claveusuario);
    setClaveusuario(claveusuario || "No especificado");
  }, [setClaveusuario]);

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
              <span>Especialidad:</span> {especialidadNombre}
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
              {medico ? (
                <div className={`${styles.section}`}>
                  <h2 className={styles.sectionTitle2}>
                    Información del Especialista
                  </h2>
                  <div
                    className={`${styles.medicoCard} group relative`}
                    title={
                      medico?.nombre === "No disponible"
                        ? "Especialista no asignado"
                        : ""
                    }
                  >
                    <h3>Médico Especialista</h3>
                    <div className={styles.medicoInfo}>
                      {/* Nombre y Especialidad como campos con tooltip */}
                      <div className={`${styles.medicoDetails} group relative`}>
                        <p
                          className={
                            medico?.nombre === "No disponible"
                              ? styles.tooltipTrigger
                              : undefined
                          }
                        >
                          <strong>Nombre:</strong>{" "}
                          {medico?.nombre || "No disponible"}
                        </p>
                        <p
                          className={
                            medico?.especialidad === "No registrada"
                              ? styles.tooltipTrigger
                              : undefined
                          }
                        >
                          <strong>Especialidad:</strong>{" "}
                          {medico?.especialidad || "No registrada"}
                        </p>

                        {/* Tooltip si no se asignó especialista */}
                        {(medico?.nombre === "No disponible" ||
                          medico?.especialidad === "No registrada") && (
                          <div
                            className={`${styles.tooltip} invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2`}
                          >
                            <div className={styles.tooltipContent}>
                              <div className={styles.tooltipHeader}>
                                <div className={styles.tooltipIcon}>
                                  <FiInfo className="w-4 h-4" />
                                </div>
                                <h3 className={styles.tooltipTitle}>
                                  Especialista no asignado
                                </h3>
                              </div>
                              <p className={styles.tooltipText}>
                                Este folio no tiene un especialista asignado.
                                Por favor, verifica.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Diagnóstico */}
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
              ) : (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle2}>
                    Información del Especialista
                  </h2>
                  <div className={styles.tooltip}>
                    <p className={styles.tooltipText}>
                      No se asignó especialista
                    </p>
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
                  showHistorial={showHistorial} // Pasar el estado showHistorial
                  handleToggleHistorial={handleToggleHistorial} // Pasar la función handleToggleHistorial
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
