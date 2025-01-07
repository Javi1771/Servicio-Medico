import React, { useState } from "react";
import Image from "next/image";
import useFetchEmpleado from "../../hooks/hookSURTIMIENTOS2/useFetchEmpleado";
import useFetchPaciente from "../../hooks/hookSURTIMIENTOS2/useFetchPaciente";
import useFetchSindicato from "../../hooks/hookSURTIMIENTOS2/useFetchSindicato";
import useFetchEspecialista from "../../hooks/hookSURTIMIENTOS2/useFetchEspecialista";
import useFetchMedicamentos from "../../hooks/hookSURTIMIENTOS2/useFetchMedicamentos";
import DatosEmpleado from "./components2/datosEmpleado";
import InformacionPaciente from "./components2/informacionPaciente";
import InformacionSindicato from "./components2/informacionSindicato";
import InformacionEspecialista from "./components2/informacionEspecialista";
import CargaMedicamentosForm from "./components2/cargaMedicamentosForm";
import styles from "../css/SURTIMIENTOS_ESTILOS/surtimientos2.module.css";

const SurtimientosBanner = () => {
  const fechaActual = new Date().toLocaleDateString("es-ES");
  const [folio, setFolio] = useState("");
  const [receta, setReceta] = useState([]);
  const [diagnostico, setDiagnostico] = useState(""); // Diagnóstico editable

  // Hooks personalizados
  const {
    empleado,
    loading: loadingEmpleado,
    error: errorEmpleado,
    fetchEmpleado,
  } = useFetchEmpleado();

  const {
    paciente,
    loading: loadingPaciente,
    error: errorPaciente,
    fetchPaciente,
  } = useFetchPaciente();

  const {
    sindicato,
    loading: loadingSindicato,
    error: errorSindicato,
    fetchSindicato,
  } = useFetchSindicato();

  const {
    especialista,
    loading: loadingEspecialista,
    error: errorEspecialista,
    fetchEspecialista,
  } = useFetchEspecialista();

  const {
    medicamentos,
    loading: loadingMedicamentos,
    error: errorMedicamentos,
  } = useFetchMedicamentos();

  // Buscar datos relacionados al folio
  const handleSearch = () => {
    if (folio.trim()) {
      fetchEmpleado(folio);
      fetchPaciente(folio);
      fetchSindicato(folio);
      fetchEspecialista(folio);
    }
  };

  // Añadir medicamento a la receta
  const handleAddMedicamento = (medicamento) => {
    setReceta((prevReceta) => [...prevReceta, medicamento]);
  };

  // Guardar receta
  const handleSaveReceta = async () => {
    try {
      const response = await fetch("/api/SURTIMIENTOS2/guardarReceta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio, medicamentos: receta, diagnostico }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la receta.");
      }

      alert("Receta guardada exitosamente.");
      setReceta([]); // Reiniciar la receta
    } catch (error) {
      console.error("Error al guardar la receta:", error.message);
      alert("Error al guardar la receta.");
    }
  };

  // Verificar si hay un folio válido
  const isFolioValido = empleado || paciente || sindicato || especialista;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        {/* Banner */}
        <div className={styles.bannerContainer}>
          <Image
            src="/baner_sjr.png"
            alt="Banner Superior"
            width={900}
            height={200}
            priority
            className={styles.bannerImage}
          />
        </div>

        {/* Título */}
        <h1 className={styles.title}>Surtimientos</h1>

        {/* Encapsulador */}
        <div className={styles.infoContainer}>
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Folio de consulta"
              className={styles.searchInput}
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
            />
            <button className={styles.searchButton} onClick={handleSearch}>
              Buscar
            </button>
          </div>

          {/* Fecha */}
          <span className={styles.date}>Fecha Actual: {fechaActual}</span>
        </div>

        {/* Cards */}
        <div className={styles.rowCards}>
          {/* Datos del Empleado */}
          {loadingEmpleado ? (
            <p className={styles.loading}>Cargando datos del empleado...</p>
          ) : errorEmpleado ? (
            <p className={styles.error}>Error: {errorEmpleado}</p>
          ) : (
            empleado && <DatosEmpleado empleado={empleado} />
          )}

          {/* Información del Paciente */}
          {loadingPaciente ? (
            <p className={styles.loading}>Cargando información del paciente...</p>
          ) : errorPaciente ? (
            <p className={styles.error}>Error: {errorPaciente}</p>
          ) : (
            paciente && <InformacionPaciente paciente={paciente} />
          )}

          {/* Información del Sindicato */}
          {loadingSindicato ? (
            <p className={styles.loading}>
              Cargando información del sindicato...
            </p>
          ) : errorSindicato ? (
            <p className={styles.error}>Error: {errorSindicato}</p>
          ) : (
            sindicato && <InformacionSindicato sindicato={sindicato} />
          )}
        </div>

        {/* Información del Especialista */}
        <div className={styles.fullWidthCard}>
          {loadingEspecialista ? (
            <p className={styles.loading}>
              Cargando información del especialista...
            </p>
          ) : errorEspecialista ? (
            <p className={styles.error}>Error: {errorEspecialista}</p>
          ) : (
            especialista && (
              <InformacionEspecialista
                especialista={especialista}
                onDiagnosticoChange={setDiagnostico}
              />
            )
          )}
        </div>

        {/* Carga de Medicamentos */}
        {isFolioValido && (
          <div className={styles.medicamentosContainer}>
            {loadingMedicamentos ? (
              <p className={styles.loading}>Cargando medicamentos...</p>
            ) : errorMedicamentos ? (
              <p className={styles.error}>Error: {errorMedicamentos}</p>
            ) : (
              medicamentos && (
                <CargaMedicamentosForm
                  medicamentos={medicamentos}
                  onAddMedicamento={handleAddMedicamento}
                  onSave={handleSaveReceta}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurtimientosBanner;
