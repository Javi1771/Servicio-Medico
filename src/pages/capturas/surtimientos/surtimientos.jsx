/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import useFetchConsulta from "../../../hooks/surtimientosHook/useFetchConsulta";
import useFetchEmpleado from "../../../hooks/surtimientosHook/useFetchEmpleado";
import styles from "../../css/estilosSurtimientos/surtimientos.module.css";
import MedicamentosForm from "../components/medicamentosForm";
import Cookies from "js-cookie"; // Asegúrate de tener instalada esta librería

export default function Surtimientos() {
  const [folioConsulta, setFolioConsulta] = useState("");
  const [claveNomina, setClaveNomina] = useState(null);
  const [sindicato, setSindicato] = useState("");
  const [medico, setMedico] = useState(null); // Información del médico
  const [especialidad, setEspecialidad] = useState(null); // Especialidad del médico

  // Declara los estados
  const [nombreMedico, setNombreMedico] = useState("");
  const [claveEspecialidad, setClaveEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadNombre, setEspecialidadNombre] = useState("No registrada");

  const { data, error, loading, fetchConsulta } = useFetchConsulta();
  const { empleadoData, empleadoError, empleadoLoading, fetchEmpleado } =
    useFetchEmpleado();

  // Manejar la búsqueda del folio de consulta
  const handleSearch = async () => {
    if (!folioConsulta) {
      alert("Por favor, ingresa un folio de consulta.");
      return;
    }

    try {
      const consultaData = await fetchConsulta(folioConsulta);
      console.log("Consulta Data:", consultaData);
      if (consultaData?.clavenomina) {
        setClaveNomina(consultaData.clavenomina);
        setSindicato(consultaData.sindicato);
        setMedico({
          nombre: consultaData.medico, // Nombre del médico desde la consulta
          especialidad: consultaData.especialidad, // Especialidad desde la consulta
        });
        setEspecialidad(consultaData.especialidad); // Especialidad del médico
      }
    } catch (err) {
      console.error("Error fetching consulta:", err.message);
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

  return (
    <div className={styles.bodyContainer}>
      <div className={styles.container}>
        <h1 className={styles.title}>Surtimientos</h1>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.searchSection}>
            <input
              type="text"
              id="folioConsulta"
              value={folioConsulta}
              onChange={(e) => setFolioConsulta(e.target.value)}
              placeholder="Folio de consulta"
              className={styles.input}
            />
            <button onClick={handleSearch} className={styles.searchButton}>
              Buscar
            </button>
          </div>
          <span className={styles.date}>
            Fecha Actual: {new Date().toLocaleDateString("es-ES")}
          </span>

          <div className={styles.medicoInfo}>
            <p>
              <span>Nombre del Médico:</span> {nombreMedico}
            </p>
            <p>
              <span>Clave Especialidad:</span> {claveEspecialidad}
            </p>
          </div>
        </div>

        {/* Resultados */}
        <div className={styles.results}>
          {loading && <p>Cargando consulta...</p>}
          {error && <p className={styles.error}>Error: {error}</p>}

          {/* Información del empleado */}
          {empleadoData && (
            <>
              <h2 className={styles.employeeTitle}>Información del Empleado</h2>
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
                  <div className={`${styles.cardContainer} ${styles.card}`}>
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
                {sindicato && (
                  <div className={`${styles.sindicatoCard} ${styles.card}`}>
                    <h3 className={styles.cardSubtitle}>Sindicato</h3>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {sindicato ? "Sindicalizado" : "No Sindicalizado"}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {sindicato || "No registrado"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
                    <strong>Nombre:</strong> {medico.nombre || "No disponible"}
                  </p>
                  <p>
                    <strong>Especialidad:</strong>{" "}
                    {especialidad || "No registrada"}
                  </p>
                </div>

                <div className={styles.diagnosticoField}>
                  <label htmlFor="diagnostico">
                    <strong>Diagnóstico:</strong>
                  </label>
                  <textarea
                    id="diagnostico"
                    className={styles.diagnosticoTextarea}
                    value={data?.diagnostico || ""} // Muestra el diagnóstico desde la consulta
                    readOnly // El campo será de solo lectura
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de medicamentos */}
        {(data || medico) && (
          <div className={styles.formContainer}>
            <MedicamentosForm />
          </div>
        )}
      </div>
    </div>
  );
}