/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

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
  nombreMedico,
  nombrePaciente,
  numeroDeNomina,
}) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [prioridad, setPrioridad] = useState("");
  const [historialEspecialidades, setHistorialEspecialidades] = useState([]);

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
      try {
        const response = await fetch(
          `/api/especialidades/historial?noNomina=${numeroDeNomina}&nombrePaciente=${encodeURIComponent(
            nombrePaciente
          )}`
        );
        const data = await response.json();
        if (response.ok) {
          setHistorialEspecialidades(data.historial);
        } else {
          console.error("Error al cargar historial:", data.message);
        }
      } catch (error) {
        console.error("Error inesperado al cargar historial:", error);
      }
    };

    fetchHistorialEspecialidades();
  }, [numeroDeNomina, nombrePaciente]);

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
    if (!especialidadSeleccionada || !observaciones || !prioridad) {
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
      claveEspecialidad: especialidadSeleccionada,
      observaciones,
      prioridad,
      nombreMedico: nombreMedico,
      numeroDeNomina: numeroDeNomina,
      nombrePaciente: nombrePaciente,
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
        html: "<p style='color: #fff; font-size: 1.1em;'>La especialidad se ha guardado exitosamente en el historial.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });

      setHistorialEspecialidades([
        ...historialEspecialidades,
        { ...datos, fecha_asignacion: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error("Error inesperado al guardar la especialidad:", error);

      //! Mostrar alerta de error
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error inesperado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error inesperado al intentar guardar la especialidad. Inténtalo nuevamente.</p>",
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

          <div className="mb-6">
            <label
              htmlFor="selectPrioridad"
              className="text-white font-semibold mb-2 block"
            >
              Prioridad:
            </label>
            <select
              id="selectPrioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 focus:ring-2 focus:ring-green-500"
              aria-label="Seleccionar prioridad"
            >
              <option value="">Seleccionar Prioridad</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded mb-12"
            onClick={handleGuardarEspecialidad}
          >
            Guardar Especialidad
          </button>
        </>
      )}

      {/* Tabla de Historial de Especialidades */}
      {historialEspecialidades.length > 0 && (
        <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
          <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
            Historial de Especialidades
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Clave Consulta
                  </th>
                  <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                    Especialidad
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
                {historialEspecialidades.length > 0 ? (
                  historialEspecialidades.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                    >
                      <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                        {item.claveConsulta}
                      </td>
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
                        {item.fecha_asignacion
                          ? new Date(item.fecha_asignacion).toLocaleDateString(
                              "es-MX",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : "Sin fecha"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-400">
                      No hay especialidades registradas para el paciente
                      seleccionado este mes.
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

export default PaseEspecialidad;
