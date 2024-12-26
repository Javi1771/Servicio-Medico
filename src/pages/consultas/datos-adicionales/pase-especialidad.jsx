/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Pusher from "pusher-js";

const MySwal = withReactContent(Swal);

const PaseEspecialidad = ({
  claveConsulta,
  pasarEspecialidad,
  setPasarEspecialidad,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  observaciones,
  setObservaciones,
  setFormularioCompleto,
  clavepaciente,
  clavenomina,
}) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [prioridad, setPrioridad] = useState("");
  const [historialEspecialidades, setHistorialEspecialidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //* Carga las especialidades al montar el componente
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
  }, [claveConsulta]);

  //* Cargar historial desde el backend
  useEffect(() => {
    const fetchHistorialEspecialidades = async () => {
      if (!clavenomina && !clavepaciente) {
        console.warn(
          "Clavenomina y Clavepaciente no están definidos, evitando llamada a la API."
        );
        setHistorialEspecialidades([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true); //* Comienza el proceso de carga
      try {
        const params = new URLSearchParams();
        if (clavenomina) params.append("clavenomina", clavenomina);
        if (clavepaciente) params.append("clavepaciente", clavepaciente);

        const url = `/api/especialidades/historial?${params.toString()}`;
        console.log("URL que se está solicitando:", url);

        const response = await fetch(url);
        if (!response.ok) {
          console.error("Error al cargar historial:", response.statusText);
          setHistorialEspecialidades([]); //! Si hay un error, inicializar como vacío
        } else {
          const data = await response.json();
          const historialFormateado = data.historial.map((item) => ({
            ...item,
            fecha_asignacion: new Date(
              item.fecha_asignacion
            ).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            especialidad: item.especialidad || "Sin asignar",
          }));
          setHistorialEspecialidades(historialFormateado); //* Actualiza el estado con los datos formateados
        }
      } catch (error) {
        console.error("Error inesperado al cargar historial:", error);
        setHistorialEspecialidades([]); //! Evita estados indefinidos
      } finally {
        setIsLoading(false); //! Finaliza el proceso de carga
      }
    };

    //* Llamada inicial para cargar historial solo si clavenomina o clavepaciente están definidos
    if (clavenomina || clavepaciente) {
      fetchHistorialEspecialidades();
    }
  }, [clavenomina, clavepaciente]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe("especialidades-channel");

    //* Manejar actualizaciones en tiempo real
    channel.bind("especialidades-updated", (data) => {
      console.log("Evento recibido de Pusher: especialidades-updated", data);

      if (data.clavepaciente === clavepaciente) {
        const historialFormateado = data.historial.map((item) => ({
          ...item,
          fecha_asignacion: new Date(item.fecha_asignacion).toLocaleDateString(
            "es-MX",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          ),
        }));

        setHistorialEspecialidades(historialFormateado);
      }
    });

    //* Manejar evento cache-especialidades
    channel.bind("cache-especialidades", (data) => {
      console.log("Evento recibido de Pusher: cache-especialidades", data);

      if (data.clavepaciente === clavepaciente) {
        //* Guardar temporalmente el historial en localStorage o estado
        localStorage.setItem(
          `especialidades:${data.claveConsulta}`,
          JSON.stringify(data)
        );
        console.log(
          `Datos de especialidades guardados temporalmente en caché para consulta ${data.claveConsulta}`
        );
      }
    });

    //? Manejar evento consulta-finalizada
    channel.bind("consulta-finalizada", async (data) => {
      console.log("Evento recibido de Pusher: consulta-finalizada", data);

      const cacheKey = `especialidades:${data.claveConsulta}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);

        try {
          //* Enviar los datos al servidor para guardar en la base de datos
          const response = await fetch("/api/especialidades/guardar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(
              "Error en el servidor al guardar especialidades:",
              errorData
            );
            throw new Error("Error al guardar en el servidor");
          }

          console.log(
            `Especialidades guardadas exitosamente en el servidor:`,
            parsedData
          );
          localStorage.removeItem(cacheKey); 
        } catch (error) {
          console.error("Error al guardar especialidades:", error);
        }
      }
    });

    //! Manejar evento consulta-cancelada
    channel.bind("consulta-cancelada", (data) => {
      console.log("Evento recibido de Pusher: consulta-cancelada", data);

      const cacheKey = `especialidades:${data.claveConsulta}`;
      localStorage.removeItem(cacheKey); //* Limpiar el caché si existe
      setHistorialEspecialidades([]); //* Limpiar el historial en la interfaz
      console.log(`Caché eliminado para consulta ${data.claveConsulta}`);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [clavepaciente]);

  //* Agregar para depuración
  Pusher.logToConsole = true;

  useEffect(() => {
    console.log(
      "Tabla actualizada con historialEspecialidades:",
      historialEspecialidades
    );
  }, [historialEspecialidades]);

  //* Verifica si el formulario está completo
  useEffect(() => {
    const camposRequeridosLlenos =
      claveConsulta && especialidadSeleccionada && observaciones && prioridad;
    if (setFormularioCompleto) {
      setFormularioCompleto(camposRequeridosLlenos);
    }
  }, [
    claveConsulta,
    especialidadSeleccionada,
    observaciones,
    prioridad,
    setFormularioCompleto,
  ]);

  const handleGuardarEspecialidad = async () => {
    if (
      pasarEspecialidad === "si" &&
      (!especialidadSeleccionada || !observaciones || !prioridad)
    ) {
      //! Mostrar alerta de advertencia
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffa726; font-weight: bold; font-size: 1.5em;'>⚠️ Campos incompletos</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, completa todos los campos antes de guardar.</p>",
        background: "linear-gradient(145deg, #3e2723, #1b0000)",
        confirmButtonColor: "#ffa726",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,193,7,0.9)] rounded-lg",
        },
      });
      return;
    }

    const datos = {
      claveConsulta,
      seasignoaespecialidad: pasarEspecialidad === "si" ? "S" : "N",
      claveEspecialidad:
        pasarEspecialidad === "si" ? especialidadSeleccionada : null,
      observaciones: pasarEspecialidad === "si" ? observaciones : null,
      prioridad: pasarEspecialidad === "si" ? prioridad : null,
      clavenomina,
      clavepaciente,
    };

    try {
      const response = await fetch("/api/especialidades/guardarEspecialidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al guardar especialidad:", errorData);

        //! Mostrar alerta de error
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar la especialidad. Por favor, inténtalo nuevamente.</p>",
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
          },
        });

        return;
      }

      //* Mostrar alerta de éxito
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Especialidad guardada</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La decisión se ha guardado exitosamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error inesperado al guardar la decisión:", error);

      //! Mostrar alerta de error
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error inesperado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error inesperado al intentar guardar. Inténtalo nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    }
  };

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
            onClick={() => setPasarEspecialidad("no")}
            aria-label="Seleccionar No para no pasar a especialidad"
          >
            No
          </button>
        </div>
      </div>

      {/* Botón adicional cuando se selecciona "no" */}
      {pasarEspecialidad === "no" && (
        <div className="mt-6 mb-12">
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
            onClick={async () => {
              Swal.fire({
                icon: "info",
                title:
                  "<span style='color: #00aaff; font-weight: bold; font-size: 1.5em;'>❗ Sin Especialidad Asignada</span>",
                html: "<p style='color: #fff; font-size: 1.1em;'>Has confirmado que no se asignará una especialidad. Esta decisión será registrada.</p>",
                background: "linear-gradient(145deg, #002f4b, #005582)",
                confirmButtonColor: "#00aaff",
                confirmButtonText:
                  "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
                customClass: {
                  popup:
                    "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,170,255,0.8)] rounded-lg",
                },
              });

              const datos = {
                claveConsulta,
                seasignoaespecialidad: "N",
                claveEspecialidad: null,
                observaciones: null,
                prioridad: null,
                clavenomina,
                clavepaciente,
              };

              try {
                const response = await fetch(
                  "/api/especialidades/guardarEspecialidad",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datos),
                  }
                );

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error("Error al guardar especialidad:", errorData);
                  return;
                }

                Swal.fire({
                  icon: "success",
                  title:
                    "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Especialidad No Asignada</span>",
                  html: "<p style='color: #fff; font-size: 1.1em;'>La decisión ha sido registrada exitosamente.</p>",
                  background: "linear-gradient(145deg, #004d40, #00251a)",
                  confirmButtonColor: "#00e676",
                  confirmButtonText:
                    "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
                  customClass: {
                    popup:
                      "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
                  },
                });
              } catch (error) {
                console.error("Error al guardar la decisión:", error);
              }
            }}
          >
            Confirmar Sin Especialidad
          </button>
        </div>
      )}

      {pasarEspecialidad === "si" && (
        <>
          <div className="mb-6">
            <label
              htmlFor="selectEspecialidad"
              className="text-white font-semibold mb-2 block"
            >
              Especialidad:
            </label>
            <select
              id="selectEspecialidad"
              value={especialidadSeleccionada}
              onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 focus:ring-2 focus:ring-green-500"
              aria-label="Seleccionar especialidad"
            >
              <option value="">Seleccionar Especialidad</option>
              {especialidades.map((especialidad) => (
                <option
                  key={especialidad.claveespecialidad}
                  value={especialidad.claveespecialidad}
                >
                  {especialidad.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="textareaObservaciones"
              className="text-white font-semibold mb-2 block"
            >
              Observaciones:
            </label>
            <textarea
              id="textareaObservaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 focus:ring-2 focus:ring-green-500"
              placeholder="Escribe aquí las observaciones..."
              aria-label="Escribe observaciones"
            />
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
                onClick={() => setPrioridad("ROJO")}
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
                onClick={() => setPrioridad("NARANJA")}
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
                onClick={() => setPrioridad("AMARILLO")}
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
                onClick={() => setPrioridad("VERDE")}
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
                onClick={() => setPrioridad("AZUL")}
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

          <button
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded mb-12"
            onClick={handleGuardarEspecialidad}
          >
            Guardar Especialidad
          </button>
        </>
      )}

      {/* Tabla de Historial de Especialidades */}
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
          Historial de Especialidades
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Especialidad Asignada
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Prioridad
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Observaciones
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Fecha de Asignación
                </th>
              </tr>
            </thead>
            <tbody>
              {console.log(
                "Datos que se renderizan en la tabla:",
                historialEspecialidades
              )}
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    Cargando historial...
                  </td>
                </tr>
              ) : historialEspecialidades.length > 0 ? (
                historialEspecialidades.map((item) => (
                  <tr
                    key={item.claveconsulta}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {item.especialidad || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {item.prioridad}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {item.observaciones}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {item.fecha_asignacion}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    No hay especialidades registradas para el paciente
                    seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaseEspecialidad;
