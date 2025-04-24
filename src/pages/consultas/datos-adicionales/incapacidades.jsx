/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import { FormularioContext } from "/src/context/FormularioContext";

import HistorialIncapacidadesTable from "../components/HistorialIncapacidades";

/* ============  🔹 HELPER PARA FORMATEAR FECHAS 🔹  ============ */
const normalizeDateForSQL = (value, start) => {
  if (!value) return null; // null → null
  if (typeof value === "string" && !value.includes("T")) return value; // ya OK
  const d = new Date(value); // acepta Date o ISO
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${start ? "00:00:00.000" : "23:59:00.000"}`
  );
};
/* ============================================================= */

const Incapacidades = ({ clavepaciente, claveConsulta, clavenomina }) => {
  const { updateFormulario } = useContext(FormularioContext);
  const [autorizarIncapacidad, setAutorizarIncapacidad] = useState("no");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [isFechaInicioOpen, setIsFechaInicioOpen] = useState(false);
  const [isFechaFinOpen, setIsFechaFinOpen] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");

  //* 🔴 Reemplazamos la tabla inline por un componente
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);

  // -------------------------------------------------------------
  //? 1) Cargar historial de incapacidades desde el backend, SOLO con clavenomina
  // -------------------------------------------------------------
  useEffect(() => {
    if (!clavenomina) {
      console.warn("Falta 'clavenomina'. Evitando llamada a la API.");
      setHistorialIncapacidades([]);
      return;
    }

    //console.log(`Cargando historial para clavenomina: ${clavenomina}`);

    const fetchHistorialIncapacidades = async () => {
      try {
        //* Construir la URL solo con clavenomina
        const queryParams = new URLSearchParams({ clavenomina });

        const response = await fetch(
          `/api/incapacidades/historial?${queryParams.toString()}`
        );

        if (!response.ok) {
          console.error("Error al cargar historial:", await response.text());
          setHistorialIncapacidades([]);
          return;
        }

        const data = await response.json();

        if (data && Array.isArray(data.historial)) {
          //* Simplemente filtrar, sin formatear fechas (asumes que ya vienen formateadas)
          const historialSinFormatear = data.historial.filter(
            (item) => item.claveincapacidad
          );

          console.log(
            "Historial recibido (sin formatear):",
            historialSinFormatear
          );
          setHistorialIncapacidades(historialSinFormatear);
        } else {
          console.warn("El historial no es un array válido:", data.historial);
          setHistorialIncapacidades([]);
        }
      } catch (error) {
        console.error("Error inesperado al cargar historial:", error);
        setHistorialIncapacidades([]);
      }
    };

    fetchHistorialIncapacidades();
  }, [clavenomina]);

  // -------------------------------------------------------------
  //? 2) Guardar datos en localStorage si se autoriza la incapacidad
  // -------------------------------------------------------------
  useEffect(() => {
    if (autorizarIncapacidad === "si") {
      const incapacidadData = {
        autorizarIncapacidad,
        fechaInicio: fechaInicio
          ? typeof fechaInicio === "string"
            ? fechaInicio
            : fechaInicio.toISOString()
          : null,
        fechaFin: fechaFin
          ? typeof fechaFin === "string"
            ? fechaFin
            : fechaFin.toISOString()
          : null,
        fechaInicio: normalizeDateForSQL(fechaInicio, true),
        fechaFin: normalizeDateForSQL(fechaFin, false),
        diagnostico: diagnostico.trim() || null,
      };
      localStorage.setItem("Incapacidad", JSON.stringify(incapacidadData));
    }
  }, [autorizarIncapacidad, fechaInicio, fechaFin, diagnostico]);

  // -------------------------------------------------------------
  //? 3) Cargar datos previos de localStorage (si existen)
  // -------------------------------------------------------------
  useEffect(() => {
    const savedData = localStorage.getItem("Incapacidad");
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      setAutorizarIncapacidad(parsedData.autorizarIncapacidad || null);
      setFechaInicio(
        parsedData.fechaInicio ? new Date(parsedData.fechaInicio) : null
      );
      setFechaFin(parsedData.fechaFin ? new Date(parsedData.fechaFin) : null);
      setDiagnostico(parsedData.diagnostico || "");
    }
  }, []);

  // -------------------------------------------------------------
  //? 4) Actualizar el estado del formulario global (FormularioContext)
  // -------------------------------------------------------------
  useEffect(() => {
    const camposCompletos =
      autorizarIncapacidad === "no" ||
      (autorizarIncapacidad === "si" && fechaInicio && fechaFin && diagnostico);

    if (updateFormulario) {
      updateFormulario("Incapacidades", camposCompletos);
    } else {
      console.warn("El contexto de formulario no está disponible.");
    }
  }, [
    autorizarIncapacidad,
    fechaInicio,
    fechaFin,
    diagnostico,
    updateFormulario,
  ]);

  // -------------------------------------------------------------
  //? 5) Si se elige "No", resetea y guarda en localStorage
  // -------------------------------------------------------------
  useEffect(() => {
    if (autorizarIncapacidad === "no") {
      const incapacidadData = {
        autorizarIncapacidad,
        fechaInicio: null,
        fechaFin: null,
        diagnostico: null,
      };

      //console.log("Guardando 'No' en localStorage:", incapacidadData);
      localStorage.setItem("Incapacidad", JSON.stringify(incapacidadData));
    }
  }, [autorizarIncapacidad]);

  // -------------------------------------------------------------
  //? Manejador para cambiar Sí / No
  // -------------------------------------------------------------
  const handleAutorizarChange = (value) => {
    setAutorizarIncapacidad(value);
    if (value === "no") {
      setFechaInicio(null);
      setFechaFin(null);
      setDiagnostico(null);
    } else {
      setFechaInicio("");
      setFechaFin("");
      setDiagnostico("");
    }
  };

  // ----------------------------------------------------------------
  //? Función auxiliar parseLocalDateString (si la necesitas)
  // ----------------------------------------------------------------
  function parseLocalDateString(dateString) {
    const [datePart] = dateString.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // ----------------------------------------------------------------
  //* Función para calcular la cantidad de días entre dos fechas
  // ----------------------------------------------------------------
  const getDiasDiferencia = () => {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = fin - inicio;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // ----------------------------------------------------------------
  //* Render principal
  // ----------------------------------------------------------------
  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Incapacidades
      </h3>

      {/* ¿Autorizar incapacidad? */}
      <div className="mb-8">
        <p className="text-white font-semibold mb-2">¿Autorizar incapacidad?</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded-md ${
              autorizarIncapacidad === "si" ? "bg-green-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handleAutorizarChange("si")}
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              autorizarIncapacidad === "no" ? "bg-red-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handleAutorizarChange("no")}
          >
            No
          </button>
        </div>
      </div>

      {autorizarIncapacidad === "si" && (
        <>
          {/* Fecha Inicial */}
          <div className="mb-6">
            <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
              Fecha Inicial:
            </label>
            <div className="relative">
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
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      //* Establecer la hora de inicio a 12:00 a.m.
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
            <div className="relative">
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
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      //* Establecer la hora final a 11:59 p.m.
                      const fechaFinalSeleccionada = `${year}-${month}-${day} 23:59:00.000`;
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
                  //* Convertir a mayúsculas lo que se escribe
                  setDiagnostico(e.target.value.toUpperCase());
                }
              }}
              maxLength={120} //! Restringe el número de caracteres a 120
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 uppercase"
              placeholder="ESCRIBE AQUÍ EL DIAGNÓSTICO... (MÁX. 120 CARACTERES)"
            />
            <p className="text-sm text-gray-300 mt-1 uppercase">
              {diagnostico.length}/120 CARACTERES
            </p>
          </div>
        </>
      )}

      {/* 🔴 AquÍ NO está la tabla inline, sino la llamada al componente */}
      {historialIncapacidades.length >= 0 && (
        <HistorialIncapacidadesTable historial={historialIncapacidades} />
      )}
    </div>
  );
};

export default Incapacidades;
