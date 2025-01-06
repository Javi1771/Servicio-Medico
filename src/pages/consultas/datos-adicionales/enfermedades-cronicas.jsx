/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const EnfermedadesCronicas = ({ clavenomina, clavepaciente }) => {
  const [historialKPI, setHistorialKPI] = useState([]);
  const [editKPIDetails, setEditKPIDetails] = useState(null);
  const [nombreEnfermedad, setNombreEnfermedad] = useState("");
  const [valorAlcanzado, setValorAlcanzado] = useState("");
  const [calificacion, setCalificacion] = useState("");
  const [observacionEvaluacion, setObservacionEvaluacion] = useState("");
  const [catalogoKPIs, setCatalogoKPIs] = useState([]);
  const [mostrarVentanaKPI, setMostrarVentanaKPI] = useState(false);

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
  const [verDetalleKPI, setVerDetalleKPI] = useState(false);
  const [detalleKPI, setDetalleKPI] = useState(null);

  // const cargarNombreEnfermedad = async (idEnfCronica) => {
  //   try {
  //     if (!idEnfCronica) {
  //       console.error("ID de enfermedad crónica no proporcionado");
  //       return;
  //     }

  //     const response = await fetch(
  //       `/api/enfermedades-kpis/obtenerNombreEnfermedad?id=${idEnfCronica}`
  //     );
  //     if (!response.ok) {
  //       throw new Error("Error al obtener el nombre de la enfermedad");
  //     }

  //     const data = await response.json();
  //     setNombreEnfermedad(data.cronica || "Desconocido");
  //   } catch (error) {
  //     console.error("Error al obtener el nombre de la enfermedad:", error);
  //   }
  // };

  const handleRowClick = async (kpi) => {
    try {
      //* Construir la URL con los parámetros requeridos
      const queryParams = new URLSearchParams({
        idRegistro: kpi.idRegistro,
        clavenomina: kpi.clavenomina,
        clavepaciente: kpi.clavepaciente || "",
      });

      const response = await fetch(
        `/api/enfermedades-kpis/obtenerHistorialKPI?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Error al obtener detalles del KPI: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Detalles del KPI seleccionados:", data);

      //* Validar que se obtuvieron datos
      if (!Array.isArray(data) || data.length === 0) {
        console.error("No se encontró detalle para el KPI seleccionado");
        MySwal.fire({
          icon: "error",
          title: "❌ No se encontraron detalles",
          text: "No se pudo cargar la información de este KPI. Verifica los datos.",
        });
        return;
      }

      //* Buscar el detalle exacto basado en `idRegistro`
      const detalleSeleccionado = data.find(
        (item) => item.idRegistro === kpi.idRegistro
      );

      if (!detalleSeleccionado) {
        console.error("No se encontró detalle para el KPI seleccionado");
        MySwal.fire({
          icon: "error",
          title: "❌ No se encontraron detalles",
          text: "No se pudo cargar la información de este KPI. Verifica los datos.",
        });
        return;
      }

      //* Asegurarse de mapear idRegistro a id_registro_kpi
      const detalleConIDKPI = {
        ...detalleSeleccionado,
        id_registro_kpi: detalleSeleccionado.idRegistro,
      };

      console.log("Detalle seleccionado con ID KPI:", detalleConIDKPI);

      //* Actualizar el estado con los detalles seleccionados
      setEditKPIDetails(detalleConIDKPI);
      setMostrarVentanaKPI(true);
    } catch (error) {
      console.error("Error al cargar detalles del KPI:", error);
      MySwal.fire({
        icon: "error",
        title: "❌ Error al cargar KPI",
        text: "Hubo un problema al obtener los datos del KPI. Inténtalo nuevamente.",
      });
    }
  };

  const fetchHistorialKPI = async () => {
    try {
      if (!clavenomina && !clavepaciente) {
        console.warn("Faltan clavenomina y clavepaciente para la consulta.");
        setHistorialKPI([]);
        return;
      }

      const queryParams = new URLSearchParams({
        clavenomina: clavenomina,
        clavepaciente: clavepaciente,
      }).toString();

      const response = await fetch(
        `/api/enfermedades-kpis/obtenerHistorialKPI?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(
          `Error al cargar el historial de KPIs: ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log("Datos recibidos del servidor:", data);

      if (!Array.isArray(data) || data.length === 0) {
        console.warn("No se encontraron registros en el historial.");
        setHistorialKPI([]);
      } else {
        setHistorialKPI(data);
      }
    } catch (error) {
      console.error("Error al cargar el historial de KPIs:", error);
    }
  };

  useEffect(() => {
    fetchHistorialKPI();
  }, [clavenomina, clavepaciente]);

  //* Cargar las enfermedades crónicas desde la base de datos
  useEffect(() => {
    async function fetchEnfermedades() {
      try {
        const response = await fetch(
          "/api/enfermedades-kpis/enfermedadesCronicas"
        );
        const data = await response.json();
        setCatalogoEnfermedades(data);
      } catch (error) {
        console.error("Error al cargar las enfermedades crónicas:", error);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cargar datos</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo cargar la información. Inténtalo nuevamente.</p>",
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
    }
    fetchEnfermedades();
  }, []);

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
          "<span style='color: #ffcc00; font-weight: bold; font-size: 1.5em;'>⚠️ Campos incompletos</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, completa todos los campos del KPI antes de guardar.</p>",
        background: "linear-gradient(145deg, #4a4a4a, #222)",
        confirmButtonColor: "#ffcc00",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,204,0,0.9)] rounded-lg",
        },
      });
      return;
    }

    const kpiData = {
      id_kpi: parseInt(nuevoKPI.id_kpi, 10),
      id_enf_cronica: parseInt(nuevoKPI.id_enf_cronica, 10),
      clavenomina,
      clavepaciente,
      valor_actual: nuevoKPI.valorActual,
      valor_objetivo: nuevoKPI.valorObjetivo,
      calificacion: null,
      observaciones: nuevoKPI.kpi,
      valor_alcanzado: false,
    };

    console.log("Datos que se enviarán para el registro del KPI:", kpiData);

    try {
      const response = await fetch("/api/enfermedades-kpis/registrarKPI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(kpiData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el KPI.");
      }

      //* Actualiza el historial desde el servidor para reflejar los datos guardados
      await fetchHistorialKPI();

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
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ KPI registrado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>El KPI se ha registrado correctamente.</p>",
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
      console.error("Error al guardar el KPI:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar el KPI</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al intentar guardar el KPI. Inténtalo nuevamente.</p>",
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

  const handleGuardarKPIDetalles = async () => {
    const fechaEvaluacion = new Date().toISOString().split("T")[0];

    //* Validación de campos
    if (!valorAlcanzado || !calificacion || !observacionEvaluacion) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffcc00; font-weight: bold; font-size: 1.5em;'>⚠️ Campos incompletos</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, completa todos los campos antes de guardar.</p>",
        background: "linear-gradient(145deg, #4a4a4a, #222)",
        confirmButtonColor: "#ffcc00",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,204,0,0.9)] rounded-lg",
        },
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      return;
    }

    const kpiData = {
      id_registro_kpi: editKPIDetails.id_registro_kpi,
      valor_alcanzado: valorAlcanzado,
      valor_actual: editKPIDetails.valor_actual,
      valor_objetivo: editKPIDetails.valor_objetivo,
      calificacion: calificacion,
      observacion_valuacion: observacionEvaluacion,
      fecha_evaluacion: fechaEvaluacion,
    };

    console.log("Enviando datos al backend para actualizar el KPI:", kpiData);

    try {
      const response = await fetch(
        "/api/enfermedades-kpis/actualizarKPIDetalles",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kpiData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el KPI.");
      }

      const responseData = await response.json();
      console.log("Respuesta del servidor al actualizar KPI:", responseData);

      setMostrarVentanaKPI(false);

      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ KPI actualizado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Los detalles del KPI se guardaron correctamente:</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });

      //* Refrescar el historial después de actualizar
      console.log(
        "Actualizando historial después de guardar detalles del KPI..."
      );
      await fetchHistorialKPI();
      console.log("Historial actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar KPI:", error);

      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al actualizar el KPI</span>",
        html: `<p style='color: #fff; font-size: 1.1em;'>${
          error.message ||
          "Hubo un problema al intentar guardar el KPI. Inténtalo nuevamente."
        }</p>`,
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

  const handleAgregarEnfermedad = () => {
    if (!enfermedad) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffcc00; font-weight: bold; font-size: 1.5em;'>⚠️ Enfermedad requerida</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, selecciona o escribe una enfermedad antes de continuar.</p>",
        background: "linear-gradient(145deg, #4a4a4a, #222)",
        confirmButtonColor: "#ffcc00",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,204,0,0.9)] rounded-lg",
        },
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      return;
    }
    setMostrarMotivo(true);
  };

  //* Cargar padecimientos actuales del paciente seleccionado
  const fetchPadecimientos = async () => {
    try {
      const response = await fetch(
        `/api/enfermedades-kpis/padecimientosActuales?clavenomina=${clavenomina}&clavepaciente=${clavepaciente}`
      );
      const data = await response.json();
      setPadecimientos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar los padecimientos actuales:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cargar datos</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo cargar la información de los padecimientos. Inténtalo nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
    }
  };

  useEffect(() => {
    fetchPadecimientos();
  }, [clavenomina, clavepaciente]);

  const handleGuardarMotivo = async () => {
    if (!motivo) {
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ffcc00; font-weight: bold; font-size: 1.5em;'>⚠️ Motivo requerido</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, especifica un motivo antes de continuar.</p>",
        background: "linear-gradient(145deg, #4a4a4a, #222)",
        confirmButtonColor: "#ffcc00",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,204,0,0.9)] rounded-lg",
        },
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
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
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Enfermedad no válida</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La enfermedad seleccionada no es válida. Selecciona otra y vuelve a intentarlo.</p>",
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

    const fechaRegistro = new Date().toISOString().split("T")[0];
    const datosEnviados = {
      id_enf_cronica: enfermedadSeleccionada.id_enf_cronica,
      clavenomina,
      clavepaciente,
      observaciones_cronica: motivo,
      fecha_registro: fechaRegistro,
    };

    try {
      const response = await fetch(
        "/api/enfermedades-kpis/guardarEnfermedadCronica",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datosEnviados),
        }
      );

      if (response.ok) {
        //* Actualizar los padecimientos después de guardar exitosamente
        await fetchPadecimientos();
        setMostrarMotivo(false);
        setMotivo("");

        MySwal.fire({
          icon: "success",
          title:
            "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Enfermedad registrada</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>La enfermedad crónica ha sido guardada exitosamente en el sistema.</p>",
          background: "linear-gradient(145deg, #004d40, #00251a)",
          confirmButtonColor: "#00e676",
          confirmButtonText:
            "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
          },
        });
      } else {
        console.error(
          "Error al guardar en la base de datos:",
          await response.json()
        );
        throw new Error("Error al guardar en la base de datos");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error del sistema</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.</p>",
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-900 p-8 rounded-3xl shadow-[0_0_30px_rgba(255,0,255,0.7)] w-full max-w-md">
            {/* Encabezado */}
            <h3 className="text-3xl font-extrabold text-center text-white tracking-wide mb-6">
              Especificar Motivo
            </h3>

            {/* Contenido */}
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full h-40 p-4 rounded-xl bg-gray-800 text-white outline-none focus:ring-4 focus:ring-blue-400 shadow-[0_0_20px_rgba(0,255,255,0.6)] placeholder-gray-500"
              placeholder="Escribe el motivo..."
            />

            {/* Botones */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handleGuardarMotivo}
                className="bg-gradient-to-r from-green-800 to-teal-600 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 border-green-500 border-b-4 
                     hover:brightness-125 hover:-translate-y-[2px] hover:border-b-6 hover:shadow-xl hover:shadow-green-300 
                     active:translate-y-[2px] active:border-b-2 active:brightness-90 active:shadow-none"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelarMotivo}
                className="bg-gradient-to-r from-red-800 to-pink-600 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 border-pink-500 border-b-4 
                     hover:brightness-125 hover:-translate-y-[2px] hover:border-b-6 hover:shadow-xl hover:shadow-pink-300 
                     active:translate-y-[2px] active:border-b-2 active:brightness-90 active:shadow-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Padecimientos Actuales */}
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
          Padecimientos Actuales
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Fecha de Registro
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Enfermedad
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              {padecimientos.length > 0 ? (
                padecimientos.map((padecimiento, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {new Date(padecimiento.fecha).toISOString().split("T")[0]}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {padecimiento.enfermedad}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {padecimiento.observaciones}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-400">
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

        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">Enfermedad:</span>
          <select
            value={nuevoKPI.id_enf_cronica || ""}
            onChange={async (e) => {
              const selectedId = e.target.value;
              setNuevoKPI({ ...nuevoKPI, id_enf_cronica: selectedId });

              if (selectedId) {
                try {
                  const response = await fetch(
                    `/api/enfermedades-kpis/obtenerKPIs?id_enf_cronica=${selectedId}`
                  );

                  if (!response.ok)
                    throw new Error("Error al obtener los KPIs");

                  const data = await response.json();
                  setCatalogoKPIs(data); //* Actualiza el catálogo de KPIs para el menú desplegable
                } catch (error) {
                  console.error("Error al obtener los KPIs:", error);
                }
              } else {
                setCatalogoKPIs([]); //* Limpia el catálogo si no hay selección
              }
            }}
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona una enfermedad...</option>
            {padecimientos.map((padecimiento) => (
              <option
                key={padecimiento.id_enf_cronica}
                value={padecimiento.id_enf_cronica}
              >
                {`${padecimiento.enfermedad || "Sin nombre"}`}
              </option>
            ))}
          </select>
        </label>

        {/* Menú desplegable de KPI */}
        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">
            KPI a Evaluar:
          </span>
          <select
            //* En lugar de usar `nuevoKPI.kpi`, usa `nuevoKPI.id_kpi`
            value={nuevoKPI.id_kpi || ""}
            onChange={(e) => {
              const selectedID = parseInt(e.target.value, 10);
              //* Buscar el KPI completo en `catalogoKPIs`
              const selectedKPI = catalogoKPIs.find(
                (item) => item.id_kpi === selectedID
              );

              setNuevoKPI({
                ...nuevoKPI,
                id_kpi: selectedID, //* Guardamos el ID en el estado
                kpi: selectedKPI ? selectedKPI.kpi : "", //* Guardamos también el texto (por si se necesita)
              });
            }}
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona un KPI...</option>
            {catalogoKPIs.map((kpi) => (
              <option key={kpi.id_kpi} value={kpi.id_kpi}>
                {kpi.kpi}
              </option>
            ))}
          </select>
        </label>

        {/* Campo de entrada para Valor Actual */}
        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">
            Valor Actual:
          </span>
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
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
          Historial de KPIs
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Fecha de Registro
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Enfermedad Crónica
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  KPI Evaluado
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Fecha de Evaluación
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Observaciones de Evaluación
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Evaluación del KPI 
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(historialKPI) && historialKPI.length > 0 ? (
                historialKPI.map((kpi, idx) => (
                  <tr
                    key={idx}
                    onClick={() => {
                      if (kpi.kpi_calificada !== "Calificada") {
                        handleRowClick(kpi);
                      }
                    }}
                    className={`hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300 ${
                      kpi.kpi_calificada === "Calificada"
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "hover:bg-purple-700"
                    }`}
                  >
                    {/* Fecha de Registro */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {kpi.fechaRegistro
                        ? new Date(kpi.fechaRegistro).toLocaleDateString(
                            "es-ES"
                          )
                        : "Sin fecha"}
                    </td>

                    {/* Enfermedad */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {kpi.nombreEnfermedad || "Sin enfermedad"}
                    </td>

                    {/* Nombre KPI */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {kpi.nombreKPI || "Sin nombre"}
                    </td>

                    {/* Fecha de Evaluación */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {kpi.fechaEvaluacion
                        ? new Date(kpi.fechaEvaluacion).toLocaleDateString(
                            "es-ES"
                          )
                        : "Sin fecha"}
                    </td>

                    {/* Observaciones */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {kpi.observacionEvaluacion || "Sin observaciones"}
                    </td>

                    {/* Estado */}
                    <td
                      className={`py-3 px-4 border-t border-gray-800 text-center font-bold text-sm md:text-base rounded-lg shadow-lg ${
                        kpi.kpi_calificada === "Calificada"
                          ? "bg-gradient-to-r from-green-900 to-green-700 text-green-200"
                          : "bg-gradient-to-r from-red-900 to-red-700 text-red-200"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {kpi.kpi_calificada === "Calificada" ? (
                          <>
                            <div className="w-8 h-8 bg-green-950 text-green-300 rounded-full flex items-center justify-center shadow-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="mt-1 text-xs uppercase tracking-wider">
                              Calificada
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-red-950 text-red-300 rounded-full flex items-center justify-center shadow-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                            <span className="mt-1 text-xs uppercase tracking-wider">
                              No calificada
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-400">
                    No se encontraron registros para este paciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarVentanaKPI && editKPIDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-900 p-8 rounded-3xl shadow-[0_0_30px_rgba(0,255,255,0.7)] w-full max-w-xl">
            {/* Encabezado */}
            <div className="absolute top-[-10px] left-[50%] transform -translate-x-[50%] w-24 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full animate-pulse"></div>
            <h3 className="text-4xl font-extrabold text-center text-white tracking-wide">
              Calificar KPI
            </h3>
            <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mt-2 rounded-full animate-pulse"></div>

            {/* Detalles */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.6)] mb-8 mt-4">
              <div className="flex items-center text-lg font-semibold text-purple-400 mb-4">
                Enfermedad:{" "}
                <span className="text-white font-light ml-2">
                  {editKPIDetails.nombreEnfermedad || "Desconocido"}
                </span>
              </div>
              <hr className="border-gray-700 mb-4" />
              <div className="flex items-center text-lg font-semibold text-purple-400 mb-4">
                Fecha de Registro:{" "}
                <span className="text-white font-light ml-2">
                  {editKPIDetails.fechaRegistro &&
                  !isNaN(Date.parse(editKPIDetails.fechaRegistro))
                    ? new Date(editKPIDetails.fechaRegistro).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )
                    : "Sin fecha"}
                </span>
              </div>
              <hr className="border-gray-700 mb-4" />
              <div className="flex items-center text-lg font-semibold text-purple-400 mb-4">
                KPI Que Se Está Evaluando:{" "}
                <span className="text-white font-light ml-2">
                  {editKPIDetails.nombreKPI || "Sin nombre"}
                </span>
              </div>

              <hr className="border-gray-700 mb-4" />
            </div>

            {/* Mostrar valores */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.6)] mb-8">
              <div className="text-lg font-semibold text-pink-400 mb-3">
                Valor Actual:{" "}
                <span className="text-white font-light">
                  {editKPIDetails?.valor_actual !== null
                    ? editKPIDetails.valor_actual
                    : "Sin valor disponible"}
                </span>
              </div>
              <div className="text-lg font-semibold text-pink-400">
                Valor Objetivo:{" "}
                <span className="text-white font-light">
                  {editKPIDetails?.valor_objetivo !== null
                    ? editKPIDetails.valor_objetivo
                    : "Sin valor disponible"}
                </span>
              </div>
            </div>

            {/* Formularios */}
            <div className="space-y-6">
              <label className="block">
                <span className="text-lg font-semibold text-yellow-400">
                  Valor Alcanzado:
                </span>
                <input
                  type="number"
                  value={valorAlcanzado}
                  onChange={(e) => setValorAlcanzado(e.target.value)}
                  className="w-full mt-2 p-3 rounded-xl bg-gray-800 text-white outline-none focus:ring-4 focus:ring-yellow-500 shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                />
              </label>

              <label className="block">
                <span className="text-lg font-semibold text-yellow-400">
                  Se cumplió el objetivo:
                </span>
                <select
                  value={calificacion}
                  onChange={(e) => setCalificacion(e.target.value)}
                  className="w-full mt-2 p-3 rounded-xl bg-gray-800 text-white outline-none focus:ring-4 focus:ring-yellow-500 shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="CUMPLIDA">Sí</option>
                  <option value="INCUMPLIDA">No</option>
                </select>
              </label>

              <label className="block">
                <span className="text-lg font-semibold text-yellow-400">
                  Observaciones:
                </span>
                <textarea
                  value={observacionEvaluacion}
                  onChange={(e) => setObservacionEvaluacion(e.target.value)}
                  className="w-full mt-2 p-3 rounded-xl bg-gray-800 text-white outline-none focus:ring-4 focus:ring-yellow-500 shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                  placeholder="Escribe observaciones..."
                />
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handleGuardarKPIDetalles}
                className="bg-gradient-to-r from-green-900 to-teal-700 text-white font-bold px-6 py-3 rounded-xl 
               transition-all duration-300 border-green-500 border-b-4 
               hover:brightness-125 hover:translate-y-[-2px] hover:border-b-6 hover:shadow-xl hover:shadow-teal-300 
               active:translate-y-[2px] active:border-b-2 active:brightness-90 active:shadow-none"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarVentanaKPI(false)}
                className="bg-gradient-to-r from-red-900 to-pink-700 text-white font-bold px-6 py-3 rounded-xl 
               transition-all duration-300 border-pink-500 border-b-4 
               hover:brightness-125 hover:translate-y-[-2px] hover:border-b-6 hover:shadow-xl hover:shadow-pink-300 
               active:translate-y-[2px] active:border-b-2 active:brightness-90 active:shadow-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnfermedadesCronicas;
