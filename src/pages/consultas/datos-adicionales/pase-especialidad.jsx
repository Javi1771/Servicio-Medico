/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import withReactContent from "sweetalert2-react-content";
import { FormularioContext } from "/src/context/FormularioContext";
import EspecialidadDropdown from "../components/EspecialidadDropdown";
import TablaHistorialEspecialidades from "../components/HistorialEspecialidades";


const PaseEspecialidad = ({
  claveConsulta,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  observaciones,
  setObservaciones,
  clavepaciente,
  clavenomina,
}) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [prioridad, setPrioridad] = useState("");
  const [historialEspecialidades, setHistorialEspecialidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pasarEspecialidad, setPasarEspecialidad] = useState("no");

  const { updateFormulario } = useContext(FormularioContext);

  //* Carga las especialidades disponibles al montar el componente
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch("/api/especialidades/especialidades");
        const data = await response.json();
        if (Array.isArray(data)) {
          setEspecialidades(data);
        } else {
          console.error("Los datos de especialidades no son un array:", data);
          setEspecialidades([]);
        }
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      }
    };
    fetchEspecialidades();
  }, []);

  //* Restaurar datos desde localStorage al montar el componente
  useEffect(() => {
    const cachedData = localStorage.getItem(
      `PaseEspecialidad:${claveConsulta}`
    );
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      //console.log("Restaurando datos desde localStorage:", parsedData);

      if (parsedData.hasOwnProperty("prioridad"))
        setPrioridad(parsedData.prioridad);
      if (parsedData.hasOwnProperty("pasarEspecialidad"))
        setPasarEspecialidad(parsedData.pasarEspecialidad);
      if (parsedData.hasOwnProperty("especialidadSeleccionada"))
        setEspecialidadSeleccionada(parsedData.especialidadSeleccionada);
      if (parsedData.hasOwnProperty("observaciones"))
        setObservaciones(parsedData.observaciones);
    }
  }, [claveConsulta]);

  useEffect(() => {
    const fetchHistorialEspecialidades = async () => {
      if (!clavepaciente || !clavenomina) {
        console.error("Faltan clavepaciente o clavenomina");
        return;
      }

      try {
        const url = `/api/especialidades/historial?${new URLSearchParams({
          clavepaciente,
          clavenomina,
        })}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && Array.isArray(data.historial)) {
          const historialMapeado = data.historial.map((item) => ({
            especialidad:
              item.especialidad ||
              "En Esta Consulta No Se Asignó A Ninguna Especialidad",
            prioridad: item.prioridad || "Prioridad No Existente",
            observaciones: item.observaciones || "Sin Observaciones",
            fecha_asignacion: item.fecha_asignacion || "Fecha No Disponible",
          }));

          setHistorialEspecialidades(historialMapeado);
        } else {
          console.error("Error al cargar el historial:", data.message || data);
          setHistorialEspecialidades([]);
        }
      } catch (error) {
        console.error("Error al cargar el historial de especialidades:", error);
        setHistorialEspecialidades([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistorialEspecialidades();
  }, [clavepaciente, clavenomina]);

  useEffect(() => {
    const cachedData = {
      pasarEspecialidad,
      prioridad,
      especialidadSeleccionada,
      observaciones,
    };
    localStorage.setItem(
      `PaseEspecialidad:${claveConsulta}`,
      JSON.stringify(cachedData)
    );
  }, [
    pasarEspecialidad,
    prioridad,
    especialidadSeleccionada,
    observaciones,
    claveConsulta,
  ]);

  //* Sincronizar datos al desmontar el componente
  useEffect(() => {
    return () => {
      const cachedData = {
        prioridad,
        pasarEspecialidad,
        especialidadSeleccionada,
        observaciones,
      };
      localStorage.setItem(
        `PaseEspecialidad:${claveConsulta}`,
        JSON.stringify(cachedData)
      );
    };
  }, [
    prioridad,
    pasarEspecialidad,
    especialidadSeleccionada,
    observaciones,
    claveConsulta,
  ]);

  //* Actualizar formulario
  useEffect(() => {
    const camposRequeridosLlenos =
      (pasarEspecialidad === "si" && prioridad && especialidadSeleccionada) ||
      pasarEspecialidad === "no";

    updateFormulario("PaseEspecialidad", camposRequeridosLlenos);
  }, [
    prioridad,
    pasarEspecialidad,
    especialidadSeleccionada,
    updateFormulario,
  ]);

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Pase a Especialidad
      </h3>

      {/* Formulario de Pase a Especialidad */}
      <div className="mb-6">
        <p className="text-white font-semibold mb-2">
          ¿Debe pasar a alguna especialidad?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded-md ${
              pasarEspecialidad === "si" ? "bg-green-600" : "bg-gray-600"
            } text-white`}
            onClick={() => setPasarEspecialidad("si")}
            aria-label="Seleccionar Sí para pasar a especialidad"
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              pasarEspecialidad === "no" ? "bg-red-600" : "bg-gray-600"
            } text-white`}
            onClick={() => {
              setPasarEspecialidad("no");
              updateFormulario("PaseEspecialidad", true); //! Indica que el formulario está completo
            }}
            aria-label="Seleccionar No para no pasar a especialidad"
          >
            No
          </button>
        </div>
      </div>

      {pasarEspecialidad === "si" && (
        <>
          <div className="mb-6">
            <label
              htmlFor="selectEspecialidad"
              className="text-white font-semibold mb-2 block"
            >
              Especialidad:
            </label>
            <EspecialidadDropdown
              especialidades={especialidades}
              value={especialidadSeleccionada}
              onChange={setEspecialidadSeleccionada}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="textareaObservaciones"
              className="text-white font-semibold mb-2 block uppercase"
            >
              OBSERVACIONES:
            </label>
            <textarea
              id="textareaObservaciones"
              value={observaciones}
              onChange={(e) => {
                if (e.target.value.length <= 120) {
                  setObservaciones(e.target.value.toUpperCase());
                }
              }}
              maxLength={120} //* También evita escribir más de 120 caracteres
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 focus:ring-2 focus:ring-green-500 uppercase"
              placeholder="ESCRIBE AQUÍ LAS OBSERVACIONES... (MÁX. 120 CARACTERES)"
              aria-label="ESCRIBE OBSERVACIONES"
            />
            <p className="text-sm text-gray-300 mt-1 uppercase">
              {observaciones.length}/120 CARACTERES
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl border-4 border-indigo-700">
            {/* Título */}
            <h2 className="text-center text-4xl font-bold text-white tracking-wide mb-10">
              TRIAGE:{" "}
              <span className="text-indigo-400">Urgencia y Consulta</span>
            </h2>

            {/* Instrucciones del Triage */}
            <div className="mb-12 p-8 bg-gradient-to-r from-purple-900 via-gray-800 to-indigo-900 rounded-xl shadow-xl border-4 border-indigo-600 relative">
              <div className="absolute inset-0 rounded-xl border border-dashed border-indigo-400 opacity-20 animate-pulse"></div>
              <h3 className="text-2xl font-bold text-center text-white mb-6">
                Instrucciones del Triage
              </h3>
              <ul className="text-gray-300 space-y-4 text-lg">
                <li>
                  <span className="font-bold text-red-500">🛑 ROJO:</span>{" "}
                  Atención inmediata para salvar la vida.
                </li>
                <li>
                  <span className="font-bold text-orange-400">⚠️ NARANJA:</span>{" "}
                  Evaluación rápida para evitar complicaciones.
                </li>
                <li>
                  <span className="font-bold text-yellow-400">
                    🌟 AMARILLO:
                  </span>{" "}
                  Valoración médica en 30 minutos.
                </li>
                <li>
                  <span className="font-bold text-green-400">✅ VERDE:</span>{" "}
                  Atención médica regular.
                </li>
                <li>
                  <span className="font-bold text-blue-400">🌐 AZUL:</span>{" "}
                  Consulta diferida según prioridad.
                </li>
              </ul>
            </div>

            {/* Categorías del Triage */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* ROJO */}
              <button
                className={`p-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 ${
                  prioridad === "ROJO"
                    ? "border-4 border-red-600 shadow-[0_0_40px_10px_rgba(255,0,0,0.9)]"
                    : "border-2 border-red-800"
                } bg-gradient-to-br from-red-800 to-red-600 hover:from-red-700 hover:to-red-500`}
                onClick={() => {
                  setPrioridad("ROJO");
                  const cachedData = JSON.parse(
                    localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) ||
                      "{}"
                  );
                  cachedData.prioridad = "ROJO";
                  localStorage.setItem(
                    `PaseEspecialidad:${claveConsulta}`,
                    JSON.stringify(cachedData)
                  );
                }}
              >
                <h3 className="text-center text-3xl font-bold text-white">
                  ROJO
                </h3>
                <p className="text-base text-gray-200 text-center mt-4">
                  Situación grave. Atención inmediata.
                  <br />
                  <strong>(Inmediato)</strong>
                </p>
              </button>

              {/* NARANJA */}
              <button
                className={`p-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 ${
                  prioridad === "NARANJA"
                    ? "border-4 border-orange-500 shadow-[0_0_40px_10px_rgba(255,140,0,0.9)]"
                    : "border-2 border-orange-700"
                } bg-gradient-to-br from-orange-800 to-orange-500 hover:from-orange-600 hover:to-orange-400`}
                onClick={() => {
                  setPrioridad("NARANJA");
                  const cachedData = JSON.parse(
                    localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) ||
                      "{}"
                  );
                  cachedData.prioridad = "NARANJA";
                  localStorage.setItem(
                    `PaseEspecialidad:${claveConsulta}`,
                    JSON.stringify(cachedData)
                  );
                }}
              >
                <h3 className="text-center text-3xl font-bold text-white">
                  NARANJA
                </h3>
                <p className="text-base text-gray-200 text-center mt-4">
                  Evaluación rápida para evitar complicaciones.
                  <br />
                  <strong>(5-10 MIN)</strong>
                </p>
              </button>

              {/* AMARILLO */}
              <button
                className={`p-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 ${
                  prioridad === "AMARILLO"
                    ? "border-4 border-yellow-500 shadow-[0_0_40px_10px_rgba(255,255,0,0.9)]"
                    : "border-2 border-yellow-700"
                } bg-gradient-to-br from-yellow-800 to-yellow-500 hover:from-yellow-600 hover:to-yellow-400`}
                onClick={() => {
                  setPrioridad("AMARILLO");
                  const cachedData = JSON.parse(
                    localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) ||
                      "{}"
                  );
                  cachedData.prioridad = "AMARILLO";
                  localStorage.setItem(
                    `PaseEspecialidad:${claveConsulta}`,
                    JSON.stringify(cachedData)
                  );
                }}
              >
                <h3 className="text-center text-3xl font-bold text-white">
                  AMARILLO
                </h3>
                <p className="text-base text-gray-200 text-center mt-4">
                  Valoración médica en 30 minutos.
                  <br />
                  <strong>(30 MIN)</strong>
                </p>
              </button>

              {/* VERDE */}
              <button
                className={`p-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 ${
                  prioridad === "VERDE"
                    ? "border-4 border-green-500 shadow-[0_0_40px_10px_rgba(0,255,0,0.9)]"
                    : "border-2 border-green-700"
                } bg-gradient-to-br from-green-800 to-green-500 hover:from-green-600 hover:to-green-400`}
                onClick={() => {
                  setPrioridad("VERDE");
                  const cachedData = JSON.parse(
                    localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) ||
                      "{}"
                  );
                  cachedData.prioridad = "VERDE";
                  localStorage.setItem(
                    `PaseEspecialidad:${claveConsulta}`,
                    JSON.stringify(cachedData)
                  );
                }}
              >
                <h3 className="text-center text-3xl font-bold text-white">
                  VERDE
                </h3>
                <p className="text-base text-gray-200 text-center mt-4">
                  Situación no grave. Atención en 120 minutos.
                  <br />
                  <strong>(120 MIN)</strong>
                </p>
              </button>

              {/* AZUL */}
              <button
                className={`p-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 ${
                  prioridad === "AZUL"
                    ? "border-4 border-blue-500 shadow-[0_0_40px_10px_rgba(0,0,255,0.9)]"
                    : "border-2 border-blue-700"
                } bg-gradient-to-br from-blue-800 to-blue-500 hover:from-blue-600 hover:to-blue-400`}
                onClick={() => {
                  setPrioridad("AZUL");
                  const cachedData = JSON.parse(
                    localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) ||
                      "{}"
                  );
                  cachedData.prioridad = "AZUL";
                  localStorage.setItem(
                    `PaseEspecialidad:${claveConsulta}`,
                    JSON.stringify(cachedData)
                  );
                }}
              >
                <h3 className="text-center text-3xl font-bold text-white">
                  AZUL
                </h3>
                <p className="text-base text-gray-200 text-center mt-4">
                  Consulta diferida en atención externa.
                  <br />
                  <strong>(+120 MIN)</strong>
                </p>
              </button>
            </div>
          </div>

          <br />
        </>
      )}

      {/* Tabla de Historial de Especialidades */}
      <TablaHistorialEspecialidades
        historial={historialEspecialidades}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PaseEspecialidad;
