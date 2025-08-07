/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import HistorialIncapacidadesTable from "../../consultas/components/HistorialIncapacidades";
import { motion } from "framer-motion";
import { showCustomAlert } from "../../../utils/alertas";

const NuevaIncapacidad = () => {
  const router = useRouter();
  const {
    claveconsulta: encryptedClaveConsulta,
    clavenomina,
    clavepaciente,
  } = router.query;
  const claveConsulta = encryptedClaveConsulta
    ? atob(encryptedClaveConsulta)
    : "";

  //* Estados
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [isFechaInicioOpen, setIsFechaInicioOpen] = useState(false);
  const [isFechaFinOpen, setIsFechaFinOpen] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);
  const [datosFaltantes, setDatosFaltantes] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  //* Refs para los calendarios
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);

  //! Cierra el calendario si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFechaInicioOpen &&
        startCalendarRef.current &&
        !startCalendarRef.current.contains(event.target)
      ) {
        setIsFechaInicioOpen(false);
      }
      if (
        isFechaFinOpen &&
        endCalendarRef.current &&
        !endCalendarRef.current.contains(event.target)
      ) {
        setIsFechaFinOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFechaInicioOpen, isFechaFinOpen]);

  //* Cargar historial (si hay clavenomina)
  useEffect(() => {
    if (clavenomina) {
      const fetchHistorial = async () => {
        try {
          const queryParams = new URLSearchParams({ clavenomina });
          const res = await fetch(
            `/api/incapacidades/historial?${queryParams.toString()}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.historial)) {
              setHistorialIncapacidades(data.historial);
            }
          }
        } catch (error) {
          console.error("Error al cargar historial:", error);
        }
      };
      fetchHistorial();
    }
  }, [clavenomina]);

  //* Cargar datos faltantes (si hay claveConsulta)
  useEffect(() => {
    if (claveConsulta) {
      const fetchDatosFaltantes = async () => {
        try {
          const resDatosFaltantes = await fetch(
            "/api/incapacidades/datosFaltantes",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folioConsulta: claveConsulta }),
            }
          );
          if (!resDatosFaltantes.ok) {
            const errorDatos = await resDatosFaltantes.json();
            throw new Error(
              errorDatos.message || "Error al obtener datos faltantes."
            );
          }
          const datos = await resDatosFaltantes.json();
          setDatosFaltantes(datos);
        } catch (error) {
          console.error("Error al cargar datos faltantes:", error);
        }
      };
      fetchDatosFaltantes();
    }
  }, [claveConsulta]);

  //* Formatea fecha a YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  //* Función para calcular la cantidad de días entre dos fechas
  const getDiasDiferencia = () => {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = fin - inicio;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  //* Guardar
  const handleGuardar = async () => {
    try {
      if (!fechaInicio || !fechaFin || !diagnostico.trim()) {
        return await showCustomAlert(
          "warning",
          "Datos incompletos",
          "Por favor, completa todos los campos antes de guardar."
        );
      }
      if (!datosFaltantes) {
        return await showCustomAlert(
          "error",
          "Datos incompletos",
          "No se pudieron obtener los datos del paciente. No es posible guardar la incapacidad."
        );
      }

      setIsSaving(true);

      const incapacidadData = {
        fechaInicial: `${formatDate(fechaInicio)} 00:00:00.000`,
        fechaFinal: `${formatDate(fechaFin)} 23:59:59.000`,
        diagnostico:
          diagnostico.trim() ||
          "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta",
        claveConsulta,
      };
      localStorage.setItem("Incapacidad", JSON.stringify(incapacidadData));

      //? 1) Guardar (endpoint /api/incapacidades/guardar)
      const payloadIncapacidad = {
        claveConsulta,
        clavenomina: clavenomina || datosFaltantes.clavenomina || "",
        fechaInicial: incapacidadData.fechaInicial,
        fechaFinal: incapacidadData.fechaFinal,
        diagnostico: incapacidadData.diagnostico,
        estatus: 1,
        clavepaciente: clavepaciente || datosFaltantes.clavepaciente || "",
      };
      const resGuardar = await fetch("/api/incapacidades/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadIncapacidad),
      });
      if (!resGuardar.ok) {
        const errorResponse = await resGuardar.json();
        throw new Error(
          errorResponse.message || "Error al guardar incapacidad."
        );
      }

      //? 2) Guardar Captura (endpoint /api/incapacidades/guardarCaptura)
      const payloadCaptura = {
        fechaInicio: incapacidadData.fechaInicial,
        fechaFin: incapacidadData.fechaFinal,
        nomina:
          localStorage.getItem("nomina") || datosFaltantes.clavenomina || "",
        nombreEmpleado:
          localStorage.getItem("nombreEmpleado") ||
          datosFaltantes.nombrepaciente ||
          "",
        departamento:
          localStorage.getItem("departamento") ||
          datosFaltantes.departamento ||
          "",
        observaciones: incapacidadData.diagnostico,
        edad: localStorage.getItem("edad") || datosFaltantes.edad || "",
        claveConsulta: incapacidadData.claveConsulta,
        claveMedico:
          localStorage.getItem("claveMedico") ||
          datosFaltantes.claveproveedor ||
          "",
      };
      const resCaptura = await fetch("/api/incapacidades/guardarCaptura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCaptura),
      });
      if (!resCaptura.ok)
        throw new Error("Error al guardar la captura de incapacidad");

      await showCustomAlert(
        "success",
        "Incapacidad guardada",
        "La incapacidad se registró con éxito."
      );

      //* Redirige a la pantalla de ver incapacidad
      router.push(
        `/capturas/incapacidades/ver-incapacidad?claveconsulta=${encryptedClaveConsulta}`
      );
    } catch (error) {
      console.error("Error al guardar incapacidad:", error);
      await showCustomAlert(
        "error",
        "Error al guardar incapacidad",
        error.message || "No se pudo completar el registro de la incapacidad."
      );
      setIsSaving(false);
    }
  };

  const handleRegresar = () => {
    router.push("/capturas/incapacidades");
  };

  return (
    <div className="relative min-h-screen fancy-bg text-gray-200 py-10 px-4 sm:px-16 flex flex-col items-center overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden -z-10 neon-particles" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="relative w-full max-w-5xl bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-700 z-10 neon-border"
      >
        {/* Botón regresar */}
        <div className="flex justify-start mb-8">
          <button
            onClick={handleRegresar}
            className="flex items-center gap-2 px-6 py-3 text-xl font-bold rounded-full bg-gradient-to-r from-purple-900 to-pink-900 shadow-2xl hover:shadow-neon text-gray-100 transition-all duration-300 neon-border"
          >
            <FaArrowLeft className="animate-pulse" />
            Regresar
          </button>
        </div>

        {/* Encabezado con nuevo estilo */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-6xl font-black tracking-wider uppercase animate-title neon-text">
            Incapacidad de Especialidad
          </h1>
          <p className="text-2xl text-gray-400 font-light italic">
            Folio de consulta:{" "}
            <span className="font-bold">{claveConsulta}</span>
          </p>
        </div>

        {/* Sección para mostrar los datos faltantes */}
        {datosFaltantes && (
          <div className="mb-8 p-6 bg-gray-700 rounded-2xl shadow-2xl neon-border">
            <h2 className="text-2xl font-bold text-gray-100">
              Datos del Paciente
            </h2>
            <p className="text-gray-300 mt-2">
              <strong>Nombre del Paciente:</strong>{" "}
              {datosFaltantes.nombrepaciente}
            </p>
            <p className="text-gray-300 mt-1">
              <strong>Nómina:</strong> {datosFaltantes.clavenomina}
            </p>
            <p className="text-gray-300 mt-1">
              <strong>Edad:</strong> {datosFaltantes.edad}
            </p>
            <p className="text-gray-300 mt-1">
              <strong>Departamento:</strong> {datosFaltantes.departamento}
            </p>
          </div>
        )}

        {/* Fecha Inicial */}
        <div className="mb-6">
          <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
            Fecha Inicial:
          </label>
          <div className="relative" ref={startCalendarRef}>
            <div
              className="flex items-center bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-full p-4 shadow-md cursor-pointer"
              onClick={() => {
                setIsFechaInicioOpen(!isFechaInicioOpen);
                setIsFechaFinOpen(false);
              }}
            >
              <FaCalendarAlt className="text-cyan-400 mr-4" size={28} />
              <span className="text-cyan-200 font-medium">
                {fechaInicio
                  ? typeof fechaInicio === "string"
                    ? fechaInicio.substring(0, 10)
                    : fechaInicio instanceof Date
                    ? fechaInicio.toISOString().substring(0, 10)
                    : "📅 Selecciona una fecha"
                  : "📅 Selecciona una fecha"}
              </span>
            </div>
            {isFechaInicioOpen && (
              <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                <Calendar
                  onChange={(date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    // Establecer la hora de inicio a 12:00 a.m.
                    const fechaSeleccionada = `${year}-${month}-${day} 00:00:00.000`;
                    setFechaInicio(fechaSeleccionada);
                    setFechaFin(null);
                    setIsFechaInicioOpen(false);
                    //console.log("Fecha Inicial:", fechaSeleccionada);
                  }}
                  value={
                    fechaInicio
                      ? new Date(
                          typeof fechaInicio === "string"
                            ? fechaInicio.replace(" ", "T")
                            : fechaInicio
                        )
                      : null
                  }
                  className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300"
                  tileDisabled={({ date }) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  navigationLabel={({ date }) => (
                    <p className="text-lg font-bold text-cyan-400">
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  nextLabel={<span className="text-cyan-400">→</span>}
                  prevLabel={<span className="text-cyan-400">←</span>}
                  next2Label={null}
                  prev2Label={null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fecha Final */}
        <div className="mb-6">
          <label className="block text-xl font-extrabold text-pink-400 mb-3 tracking-wider">
            Fecha Final:
          </label>
          <div className="relative" ref={endCalendarRef}>
            <div
              className="flex items-center bg-gradient-to-r from-red-900 via-orange-900 to-red-900 rounded-full p-4 shadow-md cursor-pointer"
              onClick={() => {
                setIsFechaFinOpen(!isFechaFinOpen);
                setIsFechaInicioOpen(false);
              }}
            >
              <FaCalendarAlt className="text-pink-400 mr-4" size={28} />
              <span>
                {fechaFin
                  ? typeof fechaFin === "string"
                    ? fechaFin.substring(0, 10)
                    : fechaFin instanceof Date
                    ? fechaFin.toISOString().substring(0, 10)
                    : "📅 Selecciona una fecha"
                  : "📅 Selecciona una fecha"}
              </span>
            </div>
            {isFechaFinOpen && (
              <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-pink-500">
                <Calendar
                  onChange={(date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    // Establecer la hora final a 11:59 p.m.
                    const fechaFinalSeleccionada = `${year}-${month}-${day} 23:59:59.000`;
                    setFechaFin(fechaFinalSeleccionada);
                    setIsFechaFinOpen(false);
                    //console.log("Fecha Final:", fechaFinalSeleccionada);
                  }}
                  value={
                    fechaFin
                      ? typeof fechaFin === "string"
                        ? new Date(fechaFin.replace(" ", "T"))
                        : fechaFin instanceof Date
                        ? fechaFin
                        : null
                      : null
                  }
                  className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-pink-300"
                  tileDisabled={({ date }) => {
                    if (!fechaInicio) return true;
                    const fechaIni =
                      typeof fechaInicio === "string"
                        ? new Date(fechaInicio.replace(" ", "T"))
                        : fechaInicio;
                    const maxDate = new Date(fechaIni);
                    maxDate.setDate(fechaIni.getDate() + 14);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < fechaIni || date > maxDate || date < today;
                  }}
                  navigationLabel={({ date }) => (
                    <p className="text-lg font-bold text-pink-400">
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  nextLabel={<span className="text-pink-400">→</span>}
                  prevLabel={<span className="text-pink-400">←</span>}
                  next2Label={null}
                  prev2Label={null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Contador de días entre fechas */}
        {fechaInicio && fechaFin && (
          <div className="mb-6 flex flex-col items-center justify-center bg-gradient-to-r from-green-600 to-blue-500 p-4 rounded-lg shadow-lg">
            <span className="text-white font-bold text-lg">
              Días de Incapacidad
            </span>
            <div className="mt-2 flex items-baseline">
              <span className="text-white text-4xl font-extrabold">
                {getDiasDiferencia()}
              </span>
              <span className="text-white ml-2 text-xl">
                {getDiasDiferencia() === 1 ? "día" : "días"}
              </span>
            </div>
          </div>
        )}

        {/* Diagnóstico */}
        <div className="mb-6">
          <label className="text-white font-semibold mb-2 block uppercase">
            DIAGNÓSTICO:
          </label>
          <textarea
            value={diagnostico}
            onChange={(e) => {
              if (e.target.value.length <= 120) {
                setDiagnostico(e.target.value.toUpperCase());
              }
            }}
            maxLength={120}
            className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 uppercase"
            placeholder="ESCRIBE AQUÍ EL DIAGNÓSTICO... (MÁX. 120 CARACTERES)"
          />
          <p className="text-sm text-gray-300 mt-1 uppercase">
            {diagnostico.length}/120 CARACTERES
          </p>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end">
          <button
            onClick={handleGuardar}
            disabled={isSaving}
            className="bg-gradient-to-r from-teal-500 to-blue-600 px-10 py-4 rounded-full font-bold text-gray-100 hover:scale-105 transition-transform shadow-2xl neon-border disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Incapacidad"}
          </button>
        </div>

        {/* Historial */}
        {historialIncapacidades.length > 0 && (
          <div className="mt-10">
            <HistorialIncapacidadesTable historial={historialIncapacidades} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NuevaIncapacidad;
