/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const EnfermedadesCronicas = ({ clavenomina, nombrePaciente }) => {
  const [enfermedad, setEnfermedad] = useState("");
  const [catalogoEnfermedades, setCatalogoEnfermedades] = useState([]);
  const [padecimientos, setPadecimientos] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [mostrarKPIs, setMostrarKPIs] = useState(false);
  const [nuevoKPI, setNuevoKPI] = useState({
    kpi: "",
    valorActual: "",
    valorObjetivo: "",
  });
  const [historialKPI, setHistorialKPI] = useState([]);
  const [verDetalleKPI, setVerDetalleKPI] = useState(false);
  const [detalleKPI, setDetalleKPI] = useState(null);

  //* Cargar las enfermedades crónicas desde la base de datos
  useEffect(() => {
    async function fetchEnfermedades() {
      try {
        const response = await fetch("/api/enfermedadesCronicas");
        const data = await response.json();
        setCatalogoEnfermedades(data);
      } catch (error) {
        console.error("Error al cargar las enfermedades crónicas:", error);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>❌ Error al cargar datos</span>",
          html: "<p style='color: #d1d5db; font-size: 1.1em;'>No se pudo cargar la información. Inténtalo nuevamente.</p>",
          background: "linear-gradient(145deg, #2d3748, #1c2230)",
          confirmButtonColor: "#7fdbff",
          confirmButtonText:
            "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-500 shadow-[0px_0px_15px_5px_rgba(255,128,128,0.7)] rounded-lg",
          },
        });
      }
    }
    fetchEnfermedades();
  }, []);

  //* Cargar padecimientos actuales del paciente seleccionado
  useEffect(() => {
    async function fetchPadecimientos() {
      try {
        const response = await fetch(
          `/api/padecimientosActuales?clavenomina=${clavenomina}&nombrePaciente=${nombrePaciente}`
        );
        const data = await response.json();
        console.log("Padecimientos obtenidos:", data); // Verifica los datos aquí
        setPadecimientos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar los padecimientos actuales:", error);
        MySwal.fire({
          icon: "error",
          title: "❌ Error al cargar datos",
          text: "No se pudo cargar la información de los padecimientos. Inténtalo nuevamente.",
        });
      }
    }
    fetchPadecimientos();
  }, [clavenomina, nombrePaciente]);

  const handleGuardarKPI = async () => {
    if (
      !nuevoKPI.kpi ||
      !nuevoKPI.valorActual ||
      !nuevoKPI.valorObjetivo ||
      !nuevoKPI.id_enf_cronica
    ) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffd700; font-weight: bold; font-size: 1.5em;'>⚠️ Campos incompletos</span>",
        html: "<p style='color: #e5e7eb; font-size: 1.1em;'>Por favor, completa todos los campos del KPI antes de guardar.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#ffd700",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-400 shadow-[0px_0px_15px_5px_rgba(255,215,0,0.7)] rounded-lg",
        },
      });
      return;
    }

    const kpiData = {
      id_enf_cronica: parseInt(nuevoKPI.id_enf_cronica, 10),
      clavenomina,
      nombre_paciente: nombrePaciente || "Desconocido", // Valor de respaldo
      valor_actual: nuevoKPI.valorActual,
      valor_objetivo: nuevoKPI.valorObjetivo,
      calificacion: null,
      observaciones: nuevoKPI.kpi,
      valor_alcanzado: false,
    };    

    try {
      const response = await fetch("/api/registrarKPI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(kpiData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el KPI.");
      }

      setHistorialKPI([
        ...historialKPI,
        { fecha: new Date().toLocaleDateString(), ...nuevoKPI },
      ]);
      setMostrarKPIs(false);
      setNuevoKPI({
        kpi: "",
        valorActual: "",
        valorObjetivo: "",
        id_enf_cronica: "",
      });

      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00ff7f; font-weight: bold; font-size: 1.5em;'>✔️ KPI registrado</span>",
        html: "<p style='color: #e5e7eb; font-size: 1.1em;'>El KPI se ha registrado correctamente.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#00ff7f",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-500 shadow-[0px_0px_15px_5px_rgba(0,255,127,0.7)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error al guardar el KPI:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar el KPI</span>",
        html: "<p style='color: #d1d5db; font-size: 1.1em;'>Hubo un problema al intentar guardar el KPI. Inténtalo nuevamente.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#7fdbff",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-500 shadow-[0px_0px_15px_5px_rgba(255,128,128,0.7)] rounded-lg",
        },
      });
    }
  };

  const handleAgregarEnfermedad = () => {
    if (!enfermedad) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffd700; font-weight: bold; font-size: 1.5em;'>⚠️ Enfermedad requerida</span>",
        html: "<p style='color: #e5e7eb; font-size: 1.1em;'>Por favor, selecciona o escribe una enfermedad antes de continuar.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#ffd700",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-400 shadow-[0px_0px_15px_5px_rgba(255,215,0,0.7)] rounded-lg",
        },
      });
      return;
    }
    setMostrarMotivo(true);
  };

  const handleGuardarMotivo = async () => {
    if (!motivo) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffd700; font-weight: bold; font-size: 1.5em;'>⚠️ Motivo requerido</span>",
        html: "<p style='color: #e5e7eb; font-size: 1.1em;'>Por favor, especifica un motivo antes de continuar.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#ffd700",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-400 shadow-[0px_0px_15px_5px_rgba(255,215,0,0.7)] rounded-lg",
        },
      });
      return;
    }

    const enfermedadSeleccionada = catalogoEnfermedades.find(
      (enf) => enf.cronica === enfermedad
    );

    if (!enfermedadSeleccionada) {
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>❌ Enfermedad no válida</span>",
        html: "<p style='color: #d1d5db; font-size: 1.1em;'>La enfermedad seleccionada no es válida. Selecciona otra y vuelve a intentarlo.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#7fdbff",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-500 shadow-[0px_0px_15px_5px_rgba(255,128,128,0.7)] rounded-lg",
        },
      });
      return;
    }

    const fechaRegistro = new Date().toISOString().split("T")[0];
    const datosEnviados = {
      id_enf_cronica: enfermedadSeleccionada.id_enf_cronica,
      clavenomina,
      observaciones_cronica: motivo,
      fecha_registro: fechaRegistro,
      nombre_paciente: nombrePaciente,
    };

    console.log("Datos enviados:", datosEnviados);

    try {
      const response = await fetch("/api/guardarEnfermedadCronica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnviados),
      });

      if (response.ok) {
        const newPadecimiento = {
          fecha: fechaRegistro,
          enfermedad,
          observaciones: motivo,
        };
        setPadecimientos([...padecimientos, newPadecimiento]);
        setMostrarMotivo(false);
        setMotivo("");

        MySwal.fire({
          icon: "success",
          title:
            "<span style='color: #00ff7f; font-weight: bold; font-size: 1.5em;'>✔️ Enfermedad registrada</span>",
          html: "<p style='color: #e5e7eb; font-size: 1.1em;'>La enfermedad crónica ha sido guardada exitosamente en el sistema.</p>",
          background: "linear-gradient(145deg, #2d3748, #1c2230)",
          confirmButtonColor: "#00ff7f",
          confirmButtonText:
            "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-green-500 shadow-[0px_0px_15px_5px_rgba(0,255,127,0.7)] rounded-lg",
          },
        });
      } else {
        const errorData = await response.json();
        console.error("Error al guardar en la base de datos:", errorData);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
          html: "<p style='color: #d1d5db; font-size: 1.1em;'>Ocurrió un problema al intentar guardar. Inténtalo nuevamente.</p>",
          background: "linear-gradient(145deg, #2d3748, #1c2230)",
          confirmButtonColor: "#7fdbff",
          confirmButtonText:
            "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-500 shadow-[0px_0px_15px_5px_rgba(255,128,128,0.7)] rounded-lg",
          },
        });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>❌ Error del sistema</span>",
        html: "<p style='color: #d1d5db; font-size: 1.1em;'>Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.</p>",
        background: "linear-gradient(145deg, #2d3748, #1c2230)",
        confirmButtonColor: "#7fdbff",
        confirmButtonText:
          "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-500 shadow-[0px_0px_15px_5px_rgba(255,128,128,0.7)] rounded-lg",
        },
      });
    }
  };

  const handleCancelarMotivo = () => {
    setMostrarMotivo(false);
    setMotivo("");
  };

  const handleAñadirKPI = () => {
    setMostrarKPIs(true);
  };

  const handleVerKPI = (kpi) => {
    setDetalleKPI(kpi);
    setVerDetalleKPI(true);
  };

  const handleCalificar = () => {
    setVerDetalleKPI(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl md:text-4xl font-extrabold mr-4">
          Enfermedades Crónicas
        </h1>
      </div>

      {/* Selección de Enfermedad */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">Enfermedad:</span>
          <select
            value={enfermedad}
            onChange={(e) => setEnfermedad(e.target.value)}
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona una enfermedad...</option>
            {catalogoEnfermedades.map((enf) => (
              <option key={enf.id_enf_cronica} value={enf.cronica}>
                {enf.cronica}
              </option>
            ))}
          </select>
        </label>
        <div className="text-right">
          <button
            onClick={handleAgregarEnfermedad}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition duration-200"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Motivo para la Enfermedad */}
      {mostrarMotivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Especificar Motivo
            </h3>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4"
              placeholder="Escribe el motivo..."
            />
            <div className="flex justify-between">
              <button
                onClick={handleGuardarMotivo}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelarMotivo}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Padecimientos Actuales */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
          Padecimientos Actuales
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-2 md:p-3">Fecha de Registro</th>
                <th className="p-2 md:p-3">Enfermedad</th>
                <th className="p-2 md:p-3">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {padecimientos.length > 0 ? (
                padecimientos.map((padecimiento, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-600 transition-colors duration-300"
                  >
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {new Date(padecimiento.fecha).toISOString().split("T")[0]}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {padecimiento.enfermedad}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {padecimiento.observaciones}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 md:py-3 px-2 md:px-4" colSpan="3">
                    No se encontraron registros de padecimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl md:text-3xl font-bold mb-4">Registro de KPIs</h2>

        {/* Verificación en consola */}
        {console.log("Padecimientos actuales:", padecimientos)}

        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">Enfermedad:</span>
          <select
            value={nuevoKPI.id_enf_cronica || ""}
            onChange={(e) => {
              setNuevoKPI({ ...nuevoKPI, id_enf_cronica: e.target.value });
              console.log(
                "ID de enfermedad seleccionada para KPI:",
                e.target.value
              );
            }}
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona una enfermedad...</option>
            {padecimientos.map((padecimiento) => (
              <option
                key={padecimiento.id_enf_cronica}
                value={padecimiento.id_enf_cronica}
              >
                {`${padecimiento.id_enf_cronica || "Sin ID"} - ${
                  padecimiento.enfermedad || "Sin nombre"
                }`}
              </option>
            ))}
          </select>
        </label>

      {/* Campo de entrada para el KPI */}
      <label className="block mb-4">
        <span className="text-lg md:text-xl font-semibold">KPI:</span>
        <input
          type="text"
          value={nuevoKPI.kpi}
          onChange={(e) => setNuevoKPI({ ...nuevoKPI, kpi: e.target.value })}
          className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          placeholder="Escribe el KPI..."
        />
      </label>

      {/* Campo de entrada para Valor Actual */}
      <label className="block mb-4">
        <span className="text-lg md:text-xl font-semibold">Valor Actual:</span>
        <input
          type="number"
          value={nuevoKPI.valorActual}
          onChange={(e) =>
            setNuevoKPI({ ...nuevoKPI, valorActual: e.target.value })
          }
          className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          placeholder="Valor Actual"
        />
      </label>

      {/* Campo de entrada para Valor Objetivo */}
      <label className="block mb-4">
        <span className="text-lg md:text-xl font-semibold">
          Valor Objetivo:
        </span>
        <input
          type="number"
          value={nuevoKPI.valorObjetivo}
          onChange={(e) =>
            setNuevoKPI({ ...nuevoKPI, valorObjetivo: e.target.value })
          }
          className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          placeholder="Valor Objetivo"
        />
      </label>

      {/* Botón para guardar el KPI */}
      <div className="text-right">
        <button
          onClick={handleGuardarKPI}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
        >
          Agregar KPI
        </button>
      </div>
      </div>

      {/* Ventana emergente para KPIs */}
      {mostrarKPIs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Detalle KPI</h3>
            <label className="block mb-4">
              <span className="text-lg font-semibold">Valor Actual:</span>
              <input
                type="text"
                value={nuevoKPI.valorActual}
                onChange={(e) =>
                  setNuevoKPI({ ...nuevoKPI, valorActual: e.target.value })
                }
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
                placeholder="Valor Actual"
              />
            </label>
            <label className="block mb-4">
              <span className="text-lg font-semibold">Valor Objetivo:</span>
              <input
                type="text"
                value={nuevoKPI.valorObjetivo}
                onChange={(e) =>
                  setNuevoKPI({ ...nuevoKPI, valorObjetivo: e.target.value })
                }
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
                placeholder="Valor Objetivo"
              />
            </label>
            <div className="flex justify-between">
              <button
                onClick={handleGuardarKPI}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarKPIs(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de KPIs */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl md:text-3xl font-bold mb-4">
          Historial de KPIs
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-2 md:p-3">Fecha</th>
                <th className="p-2 md:p-3">KPI</th>
                <th className="p-2 md:p-3">Valor Actual</th>
                <th className="p-2 md:p-3">Valor Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {historialKPI.map((kpi, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-600 transition-colors duration-300"
                >
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.fecha}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.kpi}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {kpi.valorActual}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {kpi.valorObjetivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnfermedadesCronicas;
