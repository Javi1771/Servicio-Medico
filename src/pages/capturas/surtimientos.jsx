/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
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
import useFetchSurtimientos from "../../hooks/hookSURTIMIENTOS2/useFetchSurtimientos";
import useFetchDetalleSurtimiento from "../../hooks/hookSURTIMIENTOS2/useFetchDetalleSurtimiento";

import { useRouter } from "next/router";
import useFetchMedicamentosReceta from "../../hooks/hookSURTIMIENTOS2/useFetchMedicamentosReceta";
import TablaMedicamentos from "./components2/tablaMedicamentos"; // Extensión .jsx
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SurtimientosBanner = () => {
  const {
    surtimientos,
    loadingSurtimientos,
    errorSurtimientos,
    fetchSurtimientos,
  } = useFetchSurtimientos();
  const { detalle, loadingDetalle, errorDetalle, fetchDetalleSurtimiento } =
    useFetchDetalleSurtimiento();

  const router = useRouter();

  //* Define las rutas de los sonidos de éxito y error
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  // Fecha actual en formato "dd/mm/aaaa"
  const fechaActual = new Date().toLocaleDateString("es-ES");

  // Estados locales
  const [folio, setFolio] = useState("");
  const [receta, setReceta] = useState([]);
  const [diagnostico, setDiagnostico] = useState(""); // Diagnóstico editable

  // Hooks para obtener datos
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

  const {
    medicamentos: medicamentosReceta,
    loading: loadingReceta,
    error: errorReceta,
    fetchMedicamentosReceta,
  } = useFetchMedicamentosReceta();

  const handleRemoveMedicamento = (medicamento) => {
    setReceta((prevReceta) => {
      const newReceta = prevReceta.filter(
        (med) => med.claveMedicamento !== medicamento.claveMedicamento
      );
      console.log("Nueva receta después de quitar:", newReceta);
      return newReceta;
    });
  };

  // Función que se ejecuta al pulsar "Buscar"
  const handleSearch = async () => {
    if (folio.trim()) {
      const folioNumero = parseInt(folio, 10);
      if (isNaN(folioNumero) || folioNumero <= 0) {
        playSound(false);
        Swal.fire({
          title: "Error",
          text: "Folio inválido. Debe ser un número entero positivo.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
        return;
      }

      fetchEmpleado(folioNumero);
      fetchPaciente(folioNumero);
      fetchSindicato(folioNumero);
      fetchEspecialista(folioNumero);

      try {
        const response = await fetch(
          "/api/SURTIMIENTOS2/getMedicamentosReceta",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folioReceta: folioNumero }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los medicamentos.");
        }

        const data = await response.json();
        setReceta(data); // ✅ Actualizar la receta local

        // 🔹 Llamar al hook para actualizar medicamentosReceta
        fetchMedicamentosReceta(folioNumero);
      } catch (error) {
        console.error("Error al obtener medicamentos:", error);
        playSound(false);
        Swal.fire({
          title: "Error",
          text: "Hubo un error al obtener los medicamentos.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    }
  };

  // Añadir medicamento a la receta local
  const handleAddMedicamento = (medicamento) => {
    setReceta((prevReceta) => [...prevReceta, medicamento]);
  };

  const handleSave = (medicamentosRestantes) => {
    // Aquí puedes manejar el proceso de guardar los medicamentos restantes
    console.log("Medicamentos a guardar:", medicamentosRestantes);
    // Realizar el fetch o las operaciones necesarias para guardar los datos
  };

  // Guardar la receta en la BD o generar surtimiento
  const handleSaveReceta = async () => {
    const folioNumero = parseInt(folio, 10);
    if (isNaN(folioNumero)) {
      throw new Error("Folio inválido. Debe ser un número.");
    }

    try {
      // Verificar si ya existe el surtimiento para este folio
      const response = await fetch("/api/SURTIMIENTOS2/getMedicamentosReceta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio: folioNumero }),
      });
      const medicamentosExistentes = await response.json();

      if (medicamentosExistentes.length > 0) {
        // **Caso 1:** Ya existen medicamentos en `detalleSurtimientos`
        const surtimientoResponse = await fetch(
          "/api/SURTIMIENTOS2/generarSurtimiento",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folioReceta: folioNumero,
              medicamentos: medicamentosExistentes,
              diagnostico,
            }),
          }
        );

        if (!surtimientoResponse.ok) {
          const errorData = await surtimientoResponse.json();
          throw new Error(errorData.message || "Error al generar surtimiento");
        }

        playSound(true);
        Swal.fire({
          title: "Éxito",
          text: "Surtimiento generado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });
      } else {
        // **Caso 2:** No existen medicamentos en `detalleSurtimientos`, transferimos desde `detalleReceta`
        const recetaResponse = await fetch("/api/SURTIMIENTOS2/guardarReceta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folio: folioNumero,
            medicamentos: receta,
            diagnostico,
          }),
        });

        if (!recetaResponse.ok) {
          const errorData = await recetaResponse.json();
          throw new Error(errorData.message || "Error al guardar la receta.");
        }

        playSound(true);
        Swal.fire({
          title: "Éxito",
          text: "Receta guardada exitosamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });

        // ✅ En lugar de limpiar la receta, volvemos a cargar los medicamentos
        fetchMedicamentosReceta(folioNumero);
      }
    } catch (error) {
      console.error("Error al guardar la receta:", error.message);
      playSound(false);
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la receta.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  // Verificar si al menos uno de los datos se obtuvo (folio válido)
  const isFolioValido = empleado || paciente || sindicato || especialista;

  useEffect(() => {
    console.log("Medicamentos Recetados:", medicamentosReceta);
  }, [medicamentosReceta]);

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

        {/* Encapsulador para la barra de búsqueda y la fecha */}
        <div className={styles.infoContainer}>
          {/* Barra de Búsqueda */}
          <div className={styles.searchContainer}>
            <button
              onClick={() => router.replace("/inicio-servicio-medico")}
              className={styles.regresarButton}
            >
              Regresar
            </button>
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

          {/* Fecha actual */}
          <span className={styles.date}>Fecha Actual: {fechaActual}</span>
        </div>

        {/* Sección de Tarjetas (Empleado / Paciente / Sindicato) */}
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
            <p className={styles.loading}>
              Cargando información del paciente...
            </p>
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
                onDiagnosticoChange={(value) => {
                  console.log(
                    "📝 Diagnóstico actualizado en `SurtimientosBanner`:",
                    value
                  );
                  setDiagnostico(value); // ✅ Permitir que el estado se actualice siempre
                }}
              />
            )
          )}
        </div>

        {/* Carga de Medicamentos (solo si el folio es válido) */}
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
                  disableAdd={medicamentosReceta.length > 0}
                  receta={receta}
                  folio={folio} // 🔹 Pasar el folio como prop
                />
              )
            )}
          </div>
        )}

        {/* Tabla de Medicamentos Recetados */}
        {isFolioValido && (
          <div className={styles.historialContainer}>
            <TablaMedicamentos
              folioPase={folio}
              medicamentos={receta}
              loading={loadingReceta}
              error={errorReceta}
              onRemoveMedicamento={handleRemoveMedicamento}
              // Props para historial
              surtimientos={surtimientos}
              loadingSurtimientos={loadingSurtimientos}
              errorSurtimientos={errorSurtimientos}
              onFetchSurtimientos={fetchSurtimientos}
              detalle={detalle}
              loadingDetalle={loadingDetalle}
              errorDetalle={errorDetalle}
              onFetchDetalleSurtimiento={fetchDetalleSurtimiento}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SurtimientosBanner;
