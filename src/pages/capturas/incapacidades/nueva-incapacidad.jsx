/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import HistorialIncapacidadesTable from "../../consultas/datos-adicionales/historial-incapacidades";
import { motion } from "framer-motion";

const MySwal = withReactContent(Swal);

//* Sonidos
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

//* Reproduce el sonido de éxito o error
const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

const NuevaIncapacidad = () => {
  const router = useRouter();
  const { claveconsulta: encryptedClaveConsulta, clavenomina, clavepaciente } = router.query;
  const claveConsulta = encryptedClaveConsulta ? atob(encryptedClaveConsulta) : "";

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
      if (isFechaInicioOpen && startCalendarRef.current && !startCalendarRef.current.contains(event.target)) {
        setIsFechaInicioOpen(false);
      }
      if (isFechaFinOpen && endCalendarRef.current && !endCalendarRef.current.contains(event.target)) {
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
          const res = await fetch(`/api/incapacidades/historial?${queryParams.toString()}`);
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
          const resDatosFaltantes = await fetch("/api/incapacidades/datosFaltantes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folioConsulta: claveConsulta }),
          });
          if (!resDatosFaltantes.ok) {
            const errorDatos = await resDatosFaltantes.json();
            throw new Error(errorDatos.message || "Error al obtener datos faltantes.");
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

  //* Función para ajustar el texto automáticamente (wrap) en un ancho máximo
  const drawWrappedText = (page, text, x, y, maxWidth, fontSize, font) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    const lineHeight = fontSize + 2;
    const approxCharWidth = fontSize * 0.6; // Ajusta este valor según la fuente
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (testLine.length * approxCharWidth > maxWidth) {
        page.drawText(line, { x, y: currentY, size: fontSize, font });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font });
    }
  };

  //* Guardar
  const handleGuardar = async () => {
    try {
      if (!fechaInicio || !fechaFin || !diagnostico.trim()) {
        return MySwal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Selecciona las fechas y escribe un diagnóstico.",
          confirmButtonColor: "#e74c3c",
        });
      }
      if (!datosFaltantes) {
        return MySwal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos faltantes. Intenta más tarde.",
          confirmButtonColor: "#e74c3c",
        });
      }

      setIsSaving(true);

      const incapacidadData = {
        fechaInicial: `${formatDate(fechaInicio)} 00:00:00.000`,
        fechaFinal: `${formatDate(fechaFin)} 23:59:59.000`,
        diagnostico: diagnostico.trim() || "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta",
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
        throw new Error(errorResponse.message || "Error al guardar incapacidad.");
      }

      //? 2) Guardar Captura (endpoint /api/incapacidades/guardarCaptura)
      const payloadCaptura = {
        fechaInicio: incapacidadData.fechaInicial,
        fechaFin: incapacidadData.fechaFinal,
        nomina: localStorage.getItem("nomina") || datosFaltantes.clavenomina || "",
        nombreEmpleado: localStorage.getItem("nombreEmpleado") || datosFaltantes.nombrepaciente || "",
        departamento: localStorage.getItem("departamento") || datosFaltantes.departamento || "",
        observaciones: incapacidadData.diagnostico,
        edad: localStorage.getItem("edad") || datosFaltantes.edad || "",
        claveConsulta: incapacidadData.claveConsulta,
        claveMedico: localStorage.getItem("claveMedico") || datosFaltantes.claveproveedor || "",
      };
      const resCaptura = await fetch("/api/incapacidades/guardarCaptura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCaptura),
      });
      if (!resCaptura.ok) throw new Error("Error al guardar la captura de incapacidad");

      playSound(true);
      await MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #16a085; font-weight: bold; font-size: 1.5em;'>✔️ Incapacidad guardada</span>",
        html: "<p style='color: #ecf0f1; font-size: 1.1em;'>La incapacidad se registró con éxito.</p>",
        background: "linear-gradient(145deg, #2c3e50, #34495e)",
        confirmButtonColor: "#16a085",
        confirmButtonText:
          "<span style='color: #ecf0f1; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup: "border border-teal-500 shadow-lg rounded-lg neon-border",
        },
      });

      //* Redirige a la pantalla de ver incapacidad
      router.push(
        `/capturas/incapacidades/ver-incapacidad?claveconsulta=${encryptedClaveConsulta}`
      );
      
    } catch (error) {
      console.error("Error al guardar incapacidad:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #c0392b; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
        html: "<p style='color: #ecf0f1; font-size: 1.1em;'>No se pudo completar el registro de la incapacidad.</p>",
        background: "linear-gradient(145deg, #2c3e50, #c0392b)",
        confirmButtonColor: "#c0392b",
        confirmButtonText:
          "<span style='color: #ecf0f1; font-weight: bold;'>Reintentar</span>",
        customClass: {
          popup: "border border-red-500 shadow-lg rounded-lg neon-border",
        },
      });
      setIsSaving(false);
    }
  };

  const handleRegresar = () => {
    router.replace("/capturas/incapacidades");
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
            Incapacidad Express
          </h1>
          <p className="text-2xl text-gray-400 font-light italic">
            Folio de consulta: <span className="font-bold">{claveConsulta}</span>
          </p>
        </div>

        {/* Sección para mostrar los datos faltantes */}
        {datosFaltantes && (
          <div className="mb-8 p-6 bg-gray-700 rounded-2xl shadow-2xl neon-border">
            <h2 className="text-2xl font-bold text-gray-100">Datos del Paciente</h2>
            <p className="text-gray-300 mt-2">
              <strong>Nombre del Paciente:</strong> {datosFaltantes.nombrepaciente}
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
        <div className="mb-8">
          <label className="block text-2xl font-extrabold text-teal-400 mb-4 tracking-wide">
            Fecha Inicial:
          </label>
          <div className="relative">
            <div
              className="flex items-center bg-gray-700 shadow-lg rounded-full p-5 cursor-pointer hover:scale-105 transition-transform neon-border"
              onClick={() => {
                setIsFechaInicioOpen(!isFechaInicioOpen);
                setIsFechaFinOpen(false);
              }}
            >
              <FaCalendarAlt className="text-teal-400 mr-5" size={30} />
              <span className="text-xl">
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
              <div ref={startCalendarRef} className="absolute top-20 left-0 z-50 bg-gray-700 p-8 rounded-3xl shadow-2xl ring-2 ring-teal-400">
                <Calendar
                  onChange={(date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const fechaInicialSeleccionada = `${year}-${month}-${day} 00:00:00.000`;
                    setFechaInicio(fechaInicialSeleccionada);
                    setFechaFin(null);
                    setIsFechaInicioOpen(false);
                  }}
                  value={
                    fechaInicio
                      ? typeof fechaInicio === "string"
                        ? new Date(fechaInicio.replace(" ", "T"))
                        : fechaInicio instanceof Date
                        ? fechaInicio
                        : null
                      : null
                  }
                  tileDisabled={({ date }) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="bg-gray-700 rounded-lg text-teal-400 fancy-calendar"
                  navigationLabel={({ date }) => (
                    <p className="text-xl font-bold text-teal-400">
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  nextLabel={<span className="text-teal-400">→</span>}
                  prevLabel={<span className="text-teal-400">←</span>}
                  next2Label={null}
                  prev2Label={null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fecha Final */}
        <div className="mb-8">
          <label className="block text-2xl font-extrabold text-pink-500 mb-4 tracking-wide">
            Fecha Final:
          </label>
          <div className="relative">
            <div
              className="flex items-center bg-gray-700 shadow-lg rounded-full p-5 cursor-pointer hover:scale-105 transition-transform neon-border"
              onClick={() => {
                setIsFechaFinOpen(!isFechaFinOpen);
                setIsFechaInicioOpen(false);
              }}
            >
              <FaCalendarAlt className="text-pink-500 mr-5" size={30} />
              <span className="text-xl">
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
              <div ref={endCalendarRef} className="absolute top-20 left-0 z-50 bg-gray-700 p-8 rounded-3xl shadow-2xl ring-2 ring-pink-400">
                <Calendar
                  onChange={(date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const fechaFinalSeleccionada = `${year}-${month}-${day} 23:59:59.000`;
                    setFechaFin(fechaFinalSeleccionada);
                    setIsFechaFinOpen(false);
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
                  className="bg-gray-700 rounded-lg text-pink-500 fancy-calendar"
                  tileDisabled={({ date }) => {
                    if (!fechaInicio) return true;
                    const fechaIni = new Date(fechaInicio.replace(" ", "T"));
                    const maxDate = new Date(fechaIni);
                    maxDate.setDate(fechaIni.getDate() + 15);
                    return date < fechaIni || date > maxDate;
                  }}
                  navigationLabel={({ date }) => (
                    <p className="text-xl font-bold text-pink-500">
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  nextLabel={<span className="text-pink-500">→</span>}
                  prevLabel={<span className="text-pink-500">←</span>}
                  next2Label={null}
                  prev2Label={null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="mb-8">
          <label className="block text-2xl font-extrabold text-blue-400 mb-4 tracking-wide">
            Diagnóstico:
          </label>
          <textarea
            className="w-full rounded-xl bg-gray-700 text-gray-200 p-6 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow neon-border"
            maxLength={120}
            rows={5}
            placeholder="Describe el diagnóstico... (máx. 120 caracteres)"
            value={diagnostico}
            onChange={(e) => {
              if (e.target.value.length <= 120) setDiagnostico(e.target.value);
            }}
          />
          <p className="text-lg text-gray-400 mt-2 text-right">
            {diagnostico.length}/120 caracteres
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

      {/* Estilos del calendario */}
      <style jsx global>{`
        /* Calendario con tonos oscuros y detalles neon */
        .react-calendar,
        .react-calendar * {
          color: #bdc3c7 !important;
        }
        .react-calendar {
          border: none;
          border-radius: 1rem;
          background: #34495e;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .react-calendar__navigation {
          background: transparent;
          border-bottom: 1px solid #7f8c8d;
          padding: 0.5rem;
        }
        .react-calendar__navigation button {
          background: transparent;
          font-size: 1.2rem;
          font-weight: bold;
          border: none;
          outline: none;
          transition: color 0.3s ease;
        }
        .react-calendar__navigation button:hover {
          color: #16a085 !important;
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.85rem;
          background: #2c3e50;
          padding: 0.5rem;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
          font-size: 0.85rem;
          color: #bdc3c7 !important;
        }
        .react-calendar__month-view__days {
          padding: 0.5rem;
        }
        .react-calendar__month-view__days__day {
          padding: 0.75rem;
          transition: background 0.3s ease, transform 0.3s ease;
          border-radius: 50%;
          margin: 0.25rem;
        }
        .react-calendar__month-view__days__day abbr {
          text-decoration: none;
          color: #bdc3c7 !important;
          font-size: 1rem;
          font-weight: 500;
        }
        .react-calendar__tile--now {
          border: 2px solid #e67e22;
        }
        .react-calendar__tile--active,
        .react-calendar__tile--active:enabled:hover {
          background-color: #3d566e;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(22, 160, 133, 0.3);
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #2c3e50;
          transform: scale(1.05);
        }
      `}</style>
      {/* Efectos neon extra y fondo animado */}
      <style jsx>{`
        .neon-text {
          text-shadow: 0 0 8px #16a085, 0 0 16px #16a085, 0 0 24px #16a085;
        }
        .neon-border {
          box-shadow: 0 0 15px rgba(22, 160, 133, 0.8);
        }
        .neon-particles {
          animation: neonPulse 5s linear infinite;
          background: radial-gradient(circle at 50% 50%, rgba(22, 160, 133, 0.2), transparent 70%);
          filter: blur(8px);
        }
        @keyframes neonPulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
        .hover\\:shadow-neon:hover {
          box-shadow: 0 0 20px #16a085, 0 0 30px #16a085;
        }
        .fancy-bg {
          background: linear-gradient(135deg, #1f1c2c, #928dab);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        /* Animación especial para el título */
        .animate-title {
          animation: titleGlow 3s ease-in-out infinite;
        }
        @keyframes titleGlow {
          0%, 100% {
            text-shadow: 0 0 10px #16a085, 0 0 20px #16a085, 0 0 30px #16a085;
          }
          50% {
            text-shadow: 0 0 20px #16a085, 0 0 40px #16a085, 0 0 60px #16a085;
          }
        }
      `}</style>
    </div>
  );
};

export default NuevaIncapacidad;
