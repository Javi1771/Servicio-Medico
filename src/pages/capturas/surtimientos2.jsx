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

import useFetchMedicamentosReceta from "../../hooks/hookSURTIMIENTOS2/useFetchMedicamentosReceta";
import TablaMedicamentos from "./components2/TablaMedicamentos"; // Extensión .jsx
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SurtimientosBanner = () => {
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

  // Función que se ejecuta al pulsar "Buscar"
  const handleSearch = () => {
    if (folio.trim()) {
      // Llamamos a cada fetch asociado al folio
      fetchEmpleado(folio);
      fetchPaciente(folio);
      fetchSindicato(folio);
      fetchEspecialista(folio);
      // Importante: también llamamos a la función del hook para obtener la receta
      fetchMedicamentosReceta(folio);
    }
  };

  // Añadir medicamento a la receta local
  const handleAddMedicamento = (medicamento) => {
    setReceta((prevReceta) => [...prevReceta, medicamento]);
  };

  // Guardar la receta en la BD o generar surtimiento
  const handleSaveReceta = async () => {
    if (medicamentosReceta.length > 0) {
      // **Caso 1:** Ya existen medicamentos en detalleReceta, generar surtimiento
      try {
        const folioNumero = parseInt(folio, 10);
        if (isNaN(folioNumero)) {
          throw new Error("Folio inválido. Debe ser un número.");
        }
  
        const response = await fetch("/api/SURTIMIENTOS2/generarSurtimiento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folioReceta: folioNumero,
            medicamentos: medicamentosReceta,
            diagnostico: diagnostico,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al generar surtimiento");
        }
  
        const data = await response.json();
        console.log("Surtimiento generado:", data);
  
        Swal.fire({
          title: "Éxito",
          text: "Surtimiento generado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });
      } catch (error) {
        console.error("Error al generar surtimiento:", error);
        Swal.fire({
          title: "Error",
          text: error.message || "No se pudo generar el surtimiento.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    } else {
      // **Caso 2:** No existen medicamentos en detalleReceta, guardar nueva receta
      try {
        const folioNumero = parseInt(folio, 10);
        if (isNaN(folioNumero)) {
          throw new Error("Folio inválido. Debe ser un número.");
        }
  
        console.log("Datos enviados al backend:", {
          folio: folioNumero,
          medicamentos: receta,
          diagnostico,
        });
  
        const response = await fetch("/api/SURTIMIENTOS2/guardarReceta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folio: folioNumero, // Cambiado de folioReceta a folio
            medicamentos: receta,
            diagnostico,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al guardar la receta.");
        }
  
        Swal.fire({
          title: "Éxito",
          text: "Receta guardada exitosamente.",
          icon: "success",
          confirmButtonText: "Aceptar",
        });
  
        setReceta([]); // Reiniciar la receta local
  
        // Opcional: Actualizar los medicamentos recetados
        fetchMedicamentosReceta(folioNumero);
      } catch (error) {
        console.error("Error al guardar la receta:", error.message);
        Swal.fire({
          title: "Error",
          text: error.message || "No se pudo guardar la receta.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    }
  };
  

  // Función para generar PDF usando jsPDF
  const generarPDF = (medicamentos, folio) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Receta Médica", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text(`Folio de Consulta: ${folio}`, 10, 30);

    doc.autoTable({
      startY: 40,
      head: [["Medicamento", "Indicaciones", "Cantidad"]],
      body: medicamentos.map((med) => [
        med.nombreMedicamento,
        med.indicaciones,
        med.cantidad,
      ]),
    });

    doc.save(`Receta_${folio}.pdf`);
  };

  // Verificar si al menos uno de los datos se obtuvo (folio válido)
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

        {/* Encapsulador para la barra de búsqueda y la fecha */}
        <div className={styles.infoContainer}>
          {/* Barra de Búsqueda */}
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
                onDiagnosticoChange={setDiagnostico}
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
                  receta={receta} // Pasar 'receta' como prop
                />
              )
            )}
          </div>
        )}

        {/* Tabla de Medicamentos Recetados */}
        {isFolioValido && (
          <div className={styles.historialContainer}>
            <TablaMedicamentos
              medicamentos={medicamentosReceta}
              loading={loadingReceta}
              error={errorReceta}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SurtimientosBanner;
