/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import Pusher from "pusher-js";

const MySwal = withReactContent(Swal);

const Incapacidades = ({
  clavepaciente,
  claveConsulta,
  nombreMedico,
  clavenomina,
  nombrePaciente,
}) => {
  const [autorizarIncapacidad, setAutorizarIncapacidad] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isFechaInicioOpen, setIsFechaInicioOpen] = useState(false);
  const [isFechaFinOpen, setIsFechaFinOpen] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);

  //* Cargar historial de incapacidades desde el backend
  useEffect(() => {
    if (!clavenomina || !clavepaciente) {
      console.warn("Faltan parámetros requeridos. Evitando llamada a la API.");
      setHistorialIncapacidades([]);
      return;
    }

    console.log(
      `Cargando historial para clavenomina: ${clavenomina}, clavepaciente: ${clavepaciente}`
    );

    const fetchHistorialIncapacidades = async () => {
      try {
        //* Construir la URL con los parámetros requeridos
        const queryParams = new URLSearchParams({
          clavenomina: clavenomina,
          clavepaciente: clavepaciente,
        });

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
          const historialFormateado = data.historial
            .filter((item) => item.idDetalleIncapacidad)
            .map((item) => ({
              ...item,
              fechaInicial: item.fechaInicial
                ? new Date(item.fechaInicial).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Sin fecha",
              fechaFinal: item.fechaFinal
                ? new Date(item.fechaFinal).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Sin fecha",
            }));

          console.log("Historial formateado y ordenado:", historialFormateado);
          setHistorialIncapacidades(historialFormateado);
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
  }, [clavenomina, clavepaciente]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("incapacidades-channel");

    channel.bind("incapacidades-updated", (data) => {
      console.log("Evento recibido de Pusher:", data);

      if (data && data.clavepaciente === clavepaciente) {
        if (
          data.historial &&
          Array.isArray(data.historial) &&
          data.historial.length > 0
        ) {
          const historialFormateado = data.historial.map((item) => ({
            ...item,
            claveConsulta: item.claveConsulta || "Sin clave",
            diagnostico: item.diagnostico || "Sin diagnóstico",
            fechaInicial: item.fechaInicial
              ? new Date(item.fechaInicial).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Sin fecha",
            fechaFinal: item.fechaFinal
              ? new Date(item.fechaFinal).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Sin fecha",
          }));

          console.log(
            "Historial formateado desde Pusher:",
            historialFormateado
          );

          setHistorialIncapacidades((prev) => {
            const combinado = [...prev, ...historialFormateado];

            // Eliminar duplicados basado en idDetalleIncapacidad
            const unico = combinado.reduce((acc, current) => {
              if (
                !acc.some(
                  (item) =>
                    item.idDetalleIncapacidad === current.idDetalleIncapacidad
                )
              ) {
                acc.push(current);
              }
              return acc;
            }, []);

            return unico.sort(
              (a, b) => b.idDetalleIncapacidad - a.idDetalleIncapacidad
            );
          });
        } else {
          console.warn(
            "Datos inválidos o vacíos recibidos de Pusher:",
            data.historial
          );
        }
      } else {
        console.warn("Datos de Pusher no coinciden con el paciente actual.");
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [clavepaciente]);

  const handleAutorizarChange = (value) => {
    setAutorizarIncapacidad(value);
  };

  const confirmarSinIncapacidad = async () => {
    try {
      const response = await fetch("/api/incapacidades/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clavepaciente,
          claveConsulta,
          noNomina: clavenomina,
          fechaInicial: null,
          fechaFinal: null,
          diagnostico: "Sin diagnóstico",
          estatus: 1,
          nombreMedico,
          nombrePaciente,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error al guardar 'No se asigna incapacidad':", error);

        //! Mostrar alerta de error
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar la decisión. Por favor, inténtalo nuevamente.</p>",
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
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ No se asigna incapacidad</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Se ha registrado correctamente que no se asignará incapacidad.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });

      setFechaInicio("");
      setFechaFin("");
      setDiagnostico("");
    } catch (error) {
      console.error(
        "Error inesperado al guardar 'No se asigna incapacidad':",
        error
      );

      //! Mostrar alerta de error inesperado
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error inesperado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error inesperado al intentar guardar la decisión. Inténtalo nuevamente.</p>",
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

  const guardarIncapacidadEnDB = async () => {
    if (fechaInicio && fechaFin && diagnostico) {
      const nuevaIncapacidad = {
        claveConsulta,
        noNomina: clavenomina,
        fechaInicial: fechaInicio.toISOString(),
        fechaFinal: fechaFin.toISOString(),
        diagnostico,
        estatus: 1,
        nombreMedico,
        nombrePaciente,
        clavepaciente,
      };

      try {
        const response = await fetch("/api/incapacidades/guardar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevaIncapacidad),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(
            "Error al guardar la incapacidad en la base de datos:",
            error
          );

          // Mostrar alerta de error
          MySwal.fire({
            icon: "error",
            title:
              "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
            html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar la incapacidad. Por favor, inténtalo nuevamente.</p>",
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

        const { historial, message } = await response.json();

        if (historial && Array.isArray(historial)) {
          // Formatear los datos recibidos y actualizar el historial
          const historialFormateado = historial.map((item) => ({
            ...item,
            fechaInicial: item.fechaInicial
              ? new Date(item.fechaInicial).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Sin fecha",
            fechaFinal: item.fechaFinal
              ? new Date(item.fechaFinal).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Sin fecha",
          }));

          setHistorialIncapacidades((prev) => {
            // Combinar el historial previo con el nuevo y eliminar duplicados
            const historialActualizado = [
              ...prev,
              ...historialFormateado.filter(
                (nuevo) =>
                  !prev.some(
                    (existente) =>
                      existente.idDetalleIncapacidad ===
                      nuevo.idDetalleIncapacidad
                  )
              ),
            ];

            // Ordenar por idDetalleIncapacidad (descendente)
            return historialActualizado.sort(
              (a, b) => b.idDetalleIncapacidad - a.idDetalleIncapacidad
            );
          });

          // Mostrar alerta de éxito
          MySwal.fire({
            icon: "success",
            title:
              "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Incapacidad guardada</span>",
            html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
            background: "linear-gradient(145deg, #004d40, #00251a)",
            confirmButtonColor: "#00e676",
            confirmButtonText:
              "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
            customClass: {
              popup:
                "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
            },
          });

          // Limpiar campos
          setFechaInicio("");
          setFechaFin("");
          setDiagnostico("");
        } else {
          console.warn("Respuesta del servidor inválida:", historial);
        }
      } catch (error) {
        console.error("Error inesperado al guardar la incapacidad:", error);

        // Mostrar alerta de error
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error inesperado</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error inesperado al intentar guardar la incapacidad. Inténtalo nuevamente.</p>",
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
    } else {
      // Mostrar alerta de advertencia
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
    }
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Incapacidades
      </h3>

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

      {autorizarIncapacidad === "no" && (
        <div className="mt-6">
          <button
            className="bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-500 hover:to-purple-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
            onClick={confirmarSinIncapacidad}
          >
            Confirmar Sin Incapacidad
          </button>
        </div>
      )}

      {autorizarIncapacidad === "si" && (
        <>
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
                    ? fechaInicio.toLocaleDateString()
                    : "📅 Selecciona una fecha"}
                </span>
              </div>
              {isFechaInicioOpen && (
                <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                  <Calendar
                    onChange={(date) => {
                      setFechaInicio(date);
                      setIsFechaInicioOpen(false);
                    }}
                    value={fechaInicio}
                    className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300"
                    tileClassName={({ date, view }) =>
                      "text-gray-500 bg-gray-800 border border-gray-700 rounded-md"
                    }
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
                <span className="text-pink-200 font-medium">
                  {fechaFin
                    ? fechaFin.toLocaleDateString()
                    : "📅 Selecciona una fecha"}
                </span>
              </div>
              {isFechaFinOpen && (
                <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-pink-500">
                  <Calendar
                    onChange={(date) => {
                      setFechaFin(date);
                      setIsFechaFinOpen(false);
                    }}
                    value={fechaFin}
                    className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-pink-300"
                    tileClassName={({ date, view }) =>
                      "text-gray-500 bg-gray-800 border border-gray-700 rounded-md"
                    }
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

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Diagnóstico:
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
              placeholder="Escribe aquí el diagnóstico..."
            />
          </div>

          <button
            onClick={guardarIncapacidadEnDB}
            className="bg-blue-600 text-white px-4 py-2 rounded-md mt-8 hover:bg-blue-500"
          >
            Guardar Incapacidad
          </button>
        </>
      )}

      {historialIncapacidades.length >= 0 && (
        <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mt-16">
          <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
            Historial de Incapacidades
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Clave Consulta
                  </th>
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Diagnóstico
                  </th>
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Fecha de Inicio
                  </th>
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Fecha de Fin
                  </th>
                </tr>
              </thead>
              <tbody>
                {historialIncapacidades.length > 0 ? (
                  historialIncapacidades
                    .filter(
                      (item) => item.idDetalleIncapacidad && item.claveConsulta
                    ) // Filtrar filas inválidas
                    .sort(
                      (a, b) => b.idDetalleIncapacidad - a.idDetalleIncapacidad
                    ) // Ordenar por idDetalleIncapacidad
                    .map((item) => (
                      <tr
                        key={item.idDetalleIncapacidad} // Usar idDetalleIncapacidad como clave
                        className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                      >
                        <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                          {item.claveConsulta || "Sin clave"}
                        </td>
                        <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                          {item.diagnostico || "Sin diagnóstico"}
                        </td>
                        <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                          {item.fechaInicial || "Sin fecha"}
                        </td>
                        <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                          {item.fechaFinal || "Sin fecha"}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-400">
                      No hay incapacidades registradas para el paciente
                      seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incapacidades;
