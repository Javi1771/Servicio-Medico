/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const Incapacidades = ({
  clavenomina,
  nombrePaciente,
  claveConsulta,
  nombreMedico,
}) => {
  const [autorizarIncapacidad, setAutorizarIncapacidad] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);

  useEffect(() => {
    //* Cargar historial de incapacidades desde el backend
    const fetchHistorialIncapacidades = async () => {
      try {
        const response = await fetch(
          `/api/incapacidades/historial?noNomina=${clavenomina}&nombrePaciente=${encodeURIComponent(
            nombrePaciente
          )}`
        );
        const data = await response.json();

        if (response.ok) {
          const historialFormateado = data.historial.map((item) => ({
            ...item,
            fechaInicial: new Intl.DateTimeFormat("es-ES", {
              timeZone: "UTC",
            }).format(new Date(item.fechaInicial)),
            fechaFinal: new Intl.DateTimeFormat("es-ES", {
              timeZone: "UTC",
            }).format(new Date(item.fechaFinal)),
          }));
          setHistorialIncapacidades(historialFormateado);
        } else {
          console.error("Error al cargar historial:", data.message);
        }
      } catch (error) {
        console.error("Error inesperado al cargar historial:", error);
      }
    };

    fetchHistorialIncapacidades();
  }, [clavenomina, nombrePaciente]);

  const handleAutorizarChange = (value) => {
    setAutorizarIncapacidad(value);
    if (value === "no") {
      setFechaInicio("");
      setFechaFin("");
      setDiagnostico("");
    }
  };

  const guardarIncapacidadEnDB = async () => {
    if (fechaInicio && fechaFin && diagnostico) {
      const nuevaIncapacidad = {
        claveConsulta,
        noNomina: clavenomina,
        nombrePaciente,
        fechaInicial: fechaInicio,
        fechaFinal: fechaFin,
        diagnostico,
        estatus: 1,
        nombreMedico,
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

          //! Mostrar alerta de error
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

        //* Mostrar alerta de éxito
        MySwal.fire({
          icon: "success",
          title:
            "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Incapacidad guardada</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>La incapacidad se ha guardado exitosamente en el historial.</p>",
          background: "linear-gradient(145deg, #004d40, #00251a)",
          confirmButtonColor: "#00e676",
          confirmButtonText:
            "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
          },
        });

        setHistorialIncapacidades([
          ...historialIncapacidades,
          nuevaIncapacidad,
        ]);
        setFechaInicio("");
        setFechaFin("");
        setDiagnostico("");
      } catch (error) {
        console.error("Error inesperado al guardar la incapacidad:", error);

        //! Mostrar alerta de error
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
    }
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Incapacidades
      </h3>

      <div className="mb-6">
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
          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Fecha Inicial:
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
            />
          </div>

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Fecha Final:
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
            />
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

      {historialIncapacidades.length > 0 && (
        <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6 mt-12">
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
                  historialIncapacidades.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                    >
                      <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                        {item.claveConsulta}
                      </td>
                      <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                        {item.diagnostico}
                      </td>
                      <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                        {item.fechaInicial}
                      </td>
                      <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                        {item.fechaFinal}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-400">
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
