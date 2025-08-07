/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import StudySelector from "./components/EstudiosDropdown";
import HistorialOrdenes from "./components/HistorialOrdenes";
import { useRouter } from "next/router";
import {
  FaSearch,
  FaArrowLeft,
  FaUserAlt,
  FaNotesMedical,
  FaHeartbeat,
  FaClinicMedical,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaRegSmileBeam,
  FaCalendarAlt,
  FaCalendarPlus,
} from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { showCustomAlert } from "../../utils/alertas";

const EstudioLaboratorio = () => {
  const router = useRouter();

  //* Estados principales
  const [folioConsulta, setFolioConsulta] = useState("");
  const [consultaData, setConsultaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [especialistas, setEspecialistas] = useState([]);
  const [isSaving, setIsSaving] = useState(false); //* Estado para evitar múltiples clics en guardar

  //* Estado para opciones de estudios
  const [studyOptions, setStudyOptions] = useState([]);

  //* Estado para los laboratorios (cada uno con especialista, estudios, diagnóstico, fecha y control de calendario)
  const [labs, setLabs] = useState([
    {
      selectedEspecialista: null,
      selectedStudies: [""],
      diagnosis: "",
      selectedDate: "", //* Fecha seleccionada en formato "YYYY-MM-DD"
      isDatePickerOpen: false, //* Controla si se muestra el selector de fecha
    },
  ]);

  //* Referencia para el audio (solo en cliente)
  const tapAudio = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      tapAudio.current = new Audio("/assets/tap.mp3");
    }
  }, []);

  //* Obtener opciones de estudios desde el endpoint
  useEffect(() => {
    async function fetchStudies() {
      try {
        const res = await fetch("/api/laboratorio/listaEstudios");
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudyOptions(data);
        } else {
          console.error("La respuesta no es un arreglo:", data);
          setStudyOptions([]);
        }
      } catch (error) {
        console.error("Error al obtener los estudios:", error);
        setStudyOptions([]);
      }
    }
    fetchStudies();
  }, []);

  //* Reiniciar búsqueda
  const resetearBusqueda = () => {
    setConsultaData(null);
    setEspecialistas([]);
    setFolioConsulta("");
    setLabs([
      {
        selectedEspecialista: null,
        selectedStudies: [""],
        diagnosis: "",
        selectedDate: "",
        isDatePickerOpen: false,
      },
    ]);
  };

  //* Sonido al pasar el cursor
  const handleHover = () => {
    if (tapAudio.current) {
      tapAudio.current.play();
    }
  };

  //* Buscar consulta por folio
  const handleSearch = async () => {
    if (!folioConsulta.trim()) {
await showCustomAlert(
  "warning",
  "Folio Requerido",
  "Por favor, ingresa un folio de consulta.",
  "Aceptar"
);

      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/laboratorio/obtenerConsulta?folio=${folioConsulta.trim()}`
      );
      if (!response.ok) {
        throw new Error("Consulta no encontrada");
      }
      const data = await response.json();
      setConsultaData(data);
      if (data.especialistas && data.especialistas.length > 0) {
        setEspecialistas(data.especialistas);
      } else {
        setEspecialistas([]);
      }
    } catch (error) {
      await showCustomAlert(
        "error",
        "Consulta no encontrada",
        "No se pudo encontrar una consulta con ese folio. Verifica el número e intenta nuevamente.",
        "Aceptar"
      );
    } finally {
      setLoading(false);
    }
  };

  //* Función para agregar un nuevo laboratorio
  const agregarLaboratorio = () => {
    setLabs((prev) => [
      ...prev,
      {
        selectedEspecialista: null,
        selectedStudies: [""],
        diagnosis: "",
        selectedDate: "",
        isDatePickerOpen: false,
      },
    ]);
  };

  //* Función para eliminar un laboratorio del arreglo
  const eliminarLaboratorio = (index) => {
    setLabs((prev) => prev.filter((_, i) => i !== index));
  };

  //* Manejar cambios en un laboratorio específico
  const actualizarLab = (index, field, value) => {
    setLabs((prev) =>
      prev.map((lab, i) => (i === index ? { ...lab, [field]: value } : lab))
    );
  };

  //* Actualizar un estudio específico en un laboratorio
  const actualizarStudy = (labIndex, studyIndex, value) => {
    setLabs((prev) =>
      prev.map((lab, i) => {
        if (i === labIndex) {
          const newStudies = [...lab.selectedStudies];
          newStudies[studyIndex] = value;
          return { ...lab, selectedStudies: newStudies };
        }
        return lab;
      })
    );
  };

  //* Agregar un nuevo dropdown de estudio a un laboratorio
  const agregarEstudioALab = (labIndex) => {
    setLabs((prev) =>
      prev.map((lab, i) => {
        if (i === labIndex) {
          return { ...lab, selectedStudies: [...lab.selectedStudies, ""] };
        }
        return lab;
      })
    );
  };

  //* Eliminar un dropdown de estudio de un laboratorio
  const eliminarEstudioDeLab = (labIndex, studyIndex) => {
    setLabs((prev) =>
      prev.map((lab, i) => {
        if (i === labIndex) {
          const newStudies = lab.selectedStudies.filter(
            (_, idx) => idx !== studyIndex
          );
          return { ...lab, selectedStudies: newStudies };
        }
        return lab;
      })
    );
  };

  //* Guardar estudios para todos los laboratorios
  const handleGuardar = async () => {
    if (labs.length === 0) {
await showCustomAlert(
      "warning",
      "No hay laboratorios",
      "Por favor, agrega al menos un laboratorio antes de guardar.",
      "Aceptar"
);
      return;
    }

    for (let i = 0; i < labs.length; i++) {
      const lab = labs[i];
      if (!lab.selectedEspecialista) {
await showCustomAlert(
        "warning",
        "Especialista Requerido",
        `Selecciona un especialista para el registro ${i + 1}.`,
        "Aceptar"
      );
        return;
      }
      if (lab.selectedStudies.some((study) => study === "")) {
await showCustomAlert(
        "warning",
        "Estudios Requeridos",
        `Selecciona al menos un estudio para el registro ${i + 1}.`,
        "Aceptar"
      );
        return;
      }
      if (!lab.diagnosis.trim()) {
await showCustomAlert(
        "warning",
        "Diagnóstico Requerido",
        `Ingresa un diagnóstico para el registro ${i + 1}.`,
        "Aceptar"
      );
        return;
      }
      if (!lab.selectedDate) {
await showCustomAlert(
        "warning",
        "Fecha Requerida",
        `Selecciona una fecha para el registro ${i + 1}.`,
        "Aceptar"
      );
        return;
      }
    }

    const body = {
      claveconsulta: folioConsulta.trim(),
      clavenomina: consultaData?.paciente?.clavenomina,
      clavepaciente: consultaData?.paciente?.clavepaciente,
      nombrepaciente: consultaData?.paciente?.nombrepaciente,
      edad: consultaData?.paciente?.edad,
      especialidad: consultaData?.especialidad_medico?.especialidad,
      sindicato: consultaData?.paciente?.sindicato,
      departamento: consultaData?.paciente?.departamento,
      elpacienteesempleado: consultaData?.paciente?.elpacienteesempleado,
      clavestatus: 2,
      laboratorios: labs.map((lab) => ({
        claveproveedor: lab.selectedEspecialista?.claveproveedor,
        nombreespecialista: lab.selectedEspecialista?.nombreproveedor,
        costo: lab.selectedEspecialista?.costo,
        estudios: lab.selectedStudies,
        diagnostico: lab.diagnosis,
        fecha: lab.selectedDate,
      })),
    };

    //console.log("Datos enviados:", body);
    setIsSaving(true); //! Deshabilitamos el botón y cambiamos el texto a "Guardando..."
    try {
      const res = await fetch("/api/laboratorio/insertarOrden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await showCustomAlert(
          "success",
          "Órdenes guardadas correctamente",
          "Las órdenes de estudio se han guardado exitosamente.",
          "Aceptar"
        );
        const encryptedClaveConsulta = btoa(folioConsulta.trim());
        router.push(
          `/capturas/laboratorio/ver-ordenes?claveconsulta=${encryptedClaveConsulta}`
        );
      } else {
        const errorResponse = await res.json();
        throw new Error(errorResponse.error || "Error en el servidor");
      }
    } catch (error) {
      await showCustomAlert(
        "error",
        "Error al guardar",
        error.message || "Ocurrió un error al intentar guardar los estudios.",
        "Aceptar"
      );
      setIsSaving(false); //* Habilitamos nuevamente el botón si ocurrió un error
    }
  };

  //* Campos relevantes de la consulta
  const camposRelevantes = consultaData?.paciente
    ? [
        {
          label: "Paciente",
          value: consultaData.paciente.nombrepaciente,
          icon: <FaUserAlt className="text-3xl text-[#00A7D0]" />,
        },
        {
          label: "Edad",
          value: consultaData.paciente.edad,
          icon: <FaUserAlt className="text-3xl text-[#00A7D0]" />,
        },
        {
          label: "Parentesco",
          value: consultaData.parentesco,
          icon: <FaNotesMedical className="text-3xl text-[#0084A9]" />,
        },
        {
          label: "Sindicato",
          value: consultaData.paciente.sindicato,
          icon: <FaNotesMedical className="text-3xl text-[#0084A9]" />,
        },
        {
          label: "Departamento",
          value: consultaData.paciente.departamento,
          icon: <FaNotesMedical className="text-3xl text-[#0084A9]" />,
        },
        {
          label: "Especialidad",
          value: consultaData.especialidad_medico?.especialidad || "N/A",
          icon: <FaHeartbeat className="text-3xl text-[#00576A]" />,
        },
      ]
    : [];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden bg-gradient-to-br from-[#EAFFFE] to-[#CBFFFE]">
      <div className="relative z-10 w-full max-w-4xl bg-[#EAFFFE]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-[#9BFFFF] animate-fadeIn">
        {/* Sección de búsqueda o resultados */}
        {!consultaData ? (
          <>
            {/* Barra Superior */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center justify-between w-full px-4">
                <button
                  type="button"
                  onClick={() => router.push("/inicio-servicio-medico")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00A7D0] text-[#EAFFFE] rounded-lg hover:bg-[#0084A9] transition transform hover:scale-105"
                >
                  <FaArrowLeft className="animate-bounce" />
                  <span>Regresar</span>
                </button>

                <button
                  onClick={() =>
                    router.push("/capturas/laboratorio/subir-resultados")
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#00A7D0] text-[#EAFFFE] rounded-lg hover:bg-[#0084A9] transition transform hover:scale-105"
                >
                  <FaNotesMedical className="animate-bounce" />
                  <span>Subir Resultados</span>
                </button>
              </div>

              {loading && (
                <FaSpinner className="animate-spin text-[#0084A9] text-2xl" />
              )}
            </div>
            {/* Título */}
            <h2 className="text-4xl font-extrabold text-center text-[#00576A] mb-4 uppercase tracking-wide drop-shadow-lg animate-slideDown">
              Órdenes de Estudio
            </h2>
            <p className="text-center text-xl text-[#0084A9] mb-6 font-medium animate-slideDown">
              Ingresa el folio de consulta{" "}
              <FaRegSmileBeam className="inline-block" />
            </p>
            {/* Input para folio */}
            <input
              type="number"
              placeholder="Ingrese el folio"
              className="w-full p-4 mb-6 border border-[#5BFCFF] rounded-xl focus:outline-none focus:border-[#00E6FF] focus:ring-2 focus:ring-[#00E6FF] text-[#00576A] transition-all duration-300 shadow-md"
              value={folioConsulta}
              onChange={(e) => setFolioConsulta(e.target.value)}
            />
            {/* Botón de búsqueda */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-4 bg-[#00CEFF] text-[#00384B] font-semibold rounded-xl shadow-lg hover:bg-[#0093D0] transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FaSearch />
              <span>{loading ? "Buscando..." : "Buscar"}</span>
            </button>
            {/* Espacio adicional para separar el historial */}
            <div className="mt-8">
              {/* Historial de Órdenes de Estudio */}
              <div
                className={`transition-all duration-500 ${
                  consultaData ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                } mb-6`}
              >
                <HistorialOrdenes />
              </div>
            </div>
          </>
        ) : (
          <div className="animate-fadeIn">
            {/* Botón de volver a buscar */}
            <button
              onClick={resetearBusqueda}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-[#00A7D0] text-[#EAFFFE] rounded-md hover:bg-[#0084A9] transition transform hover:scale-105"
            >
              <FaArrowLeft />
              <span>Nueva Búsqueda</span>
            </button>

            {/* Título principal */}
            <h2 className="text-3xl font-extrabold text-center text-[#00576A] mb-6 uppercase tracking-wide drop-shadow-md">
              Detalles de la Consulta
            </h2>

            {/* Datos del Paciente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {camposRelevantes.map((campo, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 border border-[#9BFFFF] rounded-xl bg-[#CBFFFE]/50 shadow-sm transition transform hover:scale-105"
                  onMouseEnter={handleHover}
                >
                  <div className="mr-4">{campo.icon}</div>
                  <div>
                    <p className="text-xl font-bold text-[#00576A]">
                      {campo.label}
                    </p>
                    <p className="text-base text-[#0084A9]">
                      {campo.value || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Información Adicional */}
            <div className="mb-8 p-6 border border-[#5BFCFF] rounded-xl bg-[#EAFFFE]/60 shadow-md">
              <h3 className="text-2xl font-bold text-[#00576A] mb-2 flex items-center gap-2">
                <FaNotesMedical className="text-2xl text-[#0084A9]" />
                Información Adicional
              </h3>
              <p className="text-lg text-[#00576A]">
                <span className="font-semibold">Tipo de Consulta:</span>{" "}
                {consultaData.paciente.especialidadinterconsulta == null
                  ? "Consulta General"
                  : "Consulta Especialidad"}
              </p>
              <p className="text-lg text-[#00576A]">
                <span className="font-semibold">Médico que lo atendió:</span>{" "}
                {consultaData.paciente.medico || "N/A"}
              </p>
              {consultaData.especialidad_medico && (
                <p className="text-lg text-[#00576A]">
                  <span className="font-semibold">Especialidad asignada:</span>{" "}
                  {consultaData.especialidad_medico.especialidad}
                </p>
              )}
              <p className="text-lg text-[#00576A]">
                <span className="font-semibold">Diagnóstico del médico:</span>{" "}
                {consultaData.paciente.diagnostico || "N/A"}
              </p>
            </div>

            {/* Sección de Laboratorios y Estudios */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#00576A] mb-4 flex items-center gap-2">
                <FaClinicMedical className="text-3xl" /> Laboratorios y Estudios
              </h3>
              {labs.map((lab, index) => (
                <div
                  key={index}
                  className="mb-6 p-6 border border-[#9BFFFF] rounded-2xl bg-[#EAFFFE]/90 shadow-lg transition transform hover:scale-105"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-[#00576A]">
                      Laboratorio #{index + 1}
                    </h4>
                    {labs.length > 1 && (
                      <button
                        onClick={() => eliminarLaboratorio(index)}
                        className="text-red-500 hover:text-red-700 transition transform hover:scale-110"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  {/* Selección de Laboratorio */}
                  {especialistas.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-lg font-bold mb-2 text-[#00576A] flex items-center gap-2">
                        <FaClinicMedical className="text-xl" /> Seleccionar
                        Laboratorio:
                      </label>
                      <select
                        value={
                          lab.selectedEspecialista
                            ? JSON.stringify(lab.selectedEspecialista)
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            actualizarLab(index, "selectedEspecialista", null);
                          } else {
                            actualizarLab(
                              index,
                              "selectedEspecialista",
                              JSON.parse(value)
                            );
                          }
                        }}
                        className="w-full p-3 border border-[#5BFCFF] rounded-xl bg-white focus:outline-none focus:border-[#00E6FF] focus:ring-2 focus:ring-[#00E6FF] text-[#00576A] transition-all duration-300 shadow-sm"
                      >
                        <option value="">Seleccionar un laboratorio</option>
                        {especialistas.map((prov, idx) => (
                          <option key={idx} value={JSON.stringify(prov)}>
                            {prov.nombreproveedor}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Calendario para seleccionar fecha */}
                  <div className="mb-4">
                    <label className="block text-lg font-bold mb-2 text-[#00576A] flex items-center gap-2">
                      <FaCalendarPlus className="text-xl" />
                      Fecha Programada Para la Entrega del Estudio:
                    </label>
                    <div className="relative">
                      <div
                        className="flex items-center bg-[#00a7c0] rounded-full p-4 shadow-md cursor-pointer"
                        onClick={() =>
                          actualizarLab(
                            index,
                            "isDatePickerOpen",
                            !lab.isDatePickerOpen
                          )
                        }
                      >
                        <FaCalendarAlt
                          className="text-[#9effff] mr-4"
                          size={28}
                        />
                        <span className="text-[#ebfffd] font-medium">
                          {lab.selectedDate
                            ? lab.selectedDate
                            : "Selecciona una fecha"}
                        </span>
                      </div>
                      {lab.isDatePickerOpen && (
                        <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                          <Calendar
                            onChange={(date) => {
                              const year = date.getFullYear();
                              const month = String(
                                date.getMonth() + 1
                              ).padStart(2, "0");
                              const day = String(date.getDate()).padStart(
                                2,
                                "0"
                              );
                              const fechaSeleccionada = `${year}-${month}-${day}`;
                              actualizarLab(
                                index,
                                "selectedDate",
                                fechaSeleccionada
                              );
                              actualizarLab(index, "isDatePickerOpen", false);
                              //console.log("Fecha Inicial:", fechaSeleccionada);
                            }}
                            value={
                              lab.selectedDate
                                ? new Date(lab.selectedDate)
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
                  {/* Componente de Selección de Estudios */}
                  <StudySelector
                    studyOptions={studyOptions}
                    selectedStudies={lab.selectedStudies}
                    onChangeStudy={(studyIndex, value) =>
                      actualizarStudy(index, studyIndex, value)
                    }
                    onAddStudy={() => agregarEstudioALab(index)}
                    onRemoveStudy={(studyIndex) =>
                      eliminarEstudioDeLab(index, studyIndex)
                    }
                  />
                  {/* Ingreso de Diagnóstico */}
                  <div className="mb-4">
                    <label className="block text-lg font-bold mb-2 text-[#00576A] flex items-center gap-2">
                      <FaNotesMedical className="text-xl" /> Ingrese Diagnóstico:
                    </label>

                    <textarea
                      rows={4}                      
                      maxLength={340}                
                      value={lab.diagnosis}
                      onChange={(e) => {
                        let value = e.target.value.toUpperCase();

                        value = value
                          .split(/\r?\n/)           
                          .slice(0, 4)              
                          .map((ln) => ln.slice(0, 85))
                          .join("\n");

                        actualizarLab(index, "diagnosis", value);
                      }}
                      className="w-full p-4 border border-[#5BFCFF] rounded-xl focus:outline-none focus:border-[#00E6FF] focus:ring-2 focus:ring-[#00E6FF] text-[#00576A] transition-all duration-300 shadow-sm"
                      placeholder="Escribe aquí el diagnóstico..."
                      style={{ textTransform: "uppercase" }}
                    />

                    {/* contador dinámico: caracteres / renglones */}
                    <p className="text-right text-sm text-[#0084A9]">
                      {lab.diagnosis.length}/340&nbsp;•&nbsp;
                      {lab.diagnosis.split(/\r?\n/).length}/4 líneas
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={agregarLaboratorio}
                className="flex items-center gap-2 bg-[#00E6FF] hover:bg-[#5BFCFF] text-[#00384B] font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                <FaPlus />
                <span>Agregar otro Laboratorio</span>
              </button>
            </div>

            {/* Botón para guardar */}
            <div className="flex justify-center">
              <button
                onClick={handleGuardar}
                disabled={isSaving}
                className={`flex items-center justify-center bg-[#00CEFF] ${
                  isSaving
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#0093D0] transition transform hover:scale-105"
                } text-[#00384B] font-bold py-4 px-8 rounded-xl shadow-2xl`}
              >
                {isSaving ? (
                  <span>Guardando...</span>
                ) : (
                  <span>Guardar Estudios</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos y animaciones */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1.2s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 1s ease forwards;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-pulseSlow {
          animation: pulseSlow 2.5s infinite;
        }
        @keyframes pulseSlow {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }
        .bg-turquoise-animated {
          background: linear-gradient(
            135deg,
            #eafffe,
            #cbfffe,
            #9bffff,
            #5bfcff,
            #00e6ff
          );
          background-size: 800% 800%;
          animation: swirlGradient 14s ease-in-out infinite;
        }
        @keyframes swirlGradient {
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
      `}</style>

      {/* Fondo animado (detrás) */}
      <div className="absolute inset-0 bg-turquoise-animated -z-10"></div>
    </div>
  );
};

export default EstudioLaboratorio;
