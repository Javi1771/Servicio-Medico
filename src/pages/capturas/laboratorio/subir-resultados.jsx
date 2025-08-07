import { useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { showCustomAlert } from "../../../utils/alertas";
import {
  FaArrowLeft,
  FaSearch,
  FaUser,
  FaBirthdayCake,
  FaIdCard,
  FaBuilding,
  FaNotesMedical,
  FaHandshake,
  FaCalendarCheck,
  FaStethoscope,
  FaCalendarAlt,
  FaVial,
  FaMoneyCheckAlt,
  FaDownload,
  FaPrint,
  FaUpload,
} from "react-icons/fa";
import { BiXCircle } from "react-icons/bi";

export default function LaboratorioScreen() {
  const router = useRouter();

  //* Estados de búsqueda y resultados
  const [folio, setFolio] = useState("");
  const [laboratorio, setLaboratorio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  //* Estado para manejar el archivo PDF y el loader en su carga
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  //* Audio de hover en las tarjetas
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio("/assets/tap.mp3");
  }

  //* Función para reproducir sonido en las tarjetas
  const handleTapSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  //* Función para buscar un folio
  const handleBuscarFolio = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setLaboratorio(null);

    try {
      const { data } = await axios.post("/api/laboratorio/buscarFolio", {
        folio,
      });
      const result = Array.isArray(data) ? data[0] : data;
      setLaboratorio(result);

      //* Si ya existe una URL_RESULTADOS, se notifica inmediatamente al usuario
      if (result && result.URL_RESULTADOS) {
        await showCustomAlert(
          "warning",
          "Resultado ya Subido",
          "Ya se ha subido el resultado para este folio. Puedes previsualizar, descargar o imprimir el PDF.",
          "Aceptar"
        );
      }
    } catch (err) {
      console.error("Error al buscar el folio:", err);
      setError("No se encontró el folio o ocurrió un error en la búsqueda.");
    } finally {
      setIsLoading(false);
    }
  };

  //! Si se borra el folio, limpia también los demás estados
  const handleFolioChange = (e) => {
    const value = e.target.value;
    setFolio(value);
    if (value.trim() === "") {
      setLaboratorio(null);
      setPdfFile(null);
      setError("");
    }
  };

  //* Manejo de cambio en archivo PDF
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  //* Función para subir el PDF usando alertas personalizadas, bloquea el botón y muestra un loader
  const handleUploadPDF = async () => {
    if (!pdfFile) {
      await showCustomAlert(
        "warning",
        "Archivo Requerido",
        "Debes seleccionar primero un archivo PDF.",
        "Aceptar"
      );

      return;
    }

    const formData = new FormData();
    formData.append("folio", folio);
    formData.append("nomina", laboratorio?.NOMINA || "");
    formData.append("pdf", pdfFile);

    try {
      setIsUploading(true);
      await axios.post("/api/laboratorio/insertarResultados", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await showCustomAlert(
        "success",
        "PDF Subido",
        "El PDF se subió exitosamente.",
        "Aceptar"
      );

      //! Limpia la pantalla tras la subida exitosa
      setFolio("");
      setLaboratorio(null);
      setPdfFile(null);
    } catch (err) {
      console.error("Error al subir el PDF:", err);
      await showCustomAlert(
        "error",
        "Error al subir el PDF",
        "Ocurrió un error al intentar subir el archivo. Por favor, intenta nuevamente.",
        "Aceptar"
      );
    } finally {
      setIsUploading(false);
    }
  };

  //* Función para renderizar la previsualización del PDF
  const renderPDF = (url) => (
    <div
      className="mt-8 p-4 rounded-2xl border shadow-[0_8px_16px_rgba(0,0,0,0.3)] bg-white/20 backdrop-blur-md"
      style={{ borderColor: "#00E6FF" }}
    >
      <h2 className="text-lg font-bold mb-4 text-[#00576A] drop-shadow-sm">
        Previsualización del Resultado PDF
      </h2>
      <div className="w-full h-96 border-2 border-dashed rounded-md overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
        <iframe
          src={url}
          className="w-full h-full"
          frameBorder="0"
          title="PDF Resultado"
        ></iframe>
      </div>
      <div className="flex justify-end gap-4 mt-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <FaDownload />
          Descargar
        </a>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <FaPrint />
          Imprimir
        </button>
      </div>
    </div>
  );

  //* Renderiza una tarjeta de dato con ícono, etiqueta y valor (incluye sonido al hover)
  const renderDato = (icon, label, value) => (
    <div
      onMouseEnter={handleTapSound}
      className="flex items-start gap-4 p-4 rounded-2xl border shadow-[0_6px_12px_rgba(0,0,0,0.2)]
                 bg-white/20 backdrop-blur-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      style={{ borderColor: "#00E6FF" }}
    >
      <div
        className="text-3xl text-white p-3 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        style={{ backgroundColor: "#065374" }}
      >
        {icon}
      </div>
      <div className="text-left">
        <p className="text-lg font-bold text-[#00384B] drop-shadow-md">
          {label}
        </p>
        <p className="text-xl font-medium tracking-wide text-[#00384B] drop-shadow-sm">
          {value ?? "N/A"}
        </p>
      </div>
    </div>
  );

  //* Renderiza la lista de estudios
  const renderEstudios = (estudios) => {
    if (!Array.isArray(estudios) || estudios.length === 0) return null;
    return (
      <div
        className="col-span-full flex flex-col gap-2 p-4 rounded-2xl border shadow-[0_6px_12px_rgba(0,0,0,0.2)]
                   bg-white/20 backdrop-blur-md hover:scale-[1.02] transition-all duration-300"
        style={{ borderColor: "#00E6FF" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="text-3xl text-white p-3 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            style={{ backgroundColor: "#065374" }}
          >
            <FaVial />
          </div>
          <div className="text-left w-full">
            <p className="text-lg font-bold mb-1 text-[#00384B] drop-shadow-md">
              Estudios
            </p>
            <ul className="list-disc pl-5 text-[#00384B]">
              {estudios.map((estudio, i) => (
                <li key={i} className="text-base drop-shadow-sm">
                  {estudio.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  //* Renderiza información de laboratorios
  const renderLaboratorios = (laboratorios) => {
    if (!Array.isArray(laboratorios) || laboratorios.length === 0) return null;
    return laboratorios.map((lab, index) => (
      <div
        key={index}
        className="col-span-full flex flex-col gap-4 p-4 rounded-2xl border shadow-[0_6px_12px_rgba(0,0,0,0.2)]
                   bg-white/20 backdrop-blur-md hover:scale-[1.02] transition-all duration-300"
        style={{ borderColor: "#00E6FF" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="text-3xl text-white p-3 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            style={{ backgroundColor: "#00E6FF" }}
          >
            <FaVial />
          </div>
          <div className="text-left w-full">
            <p className="text-lg font-bold mb-1 text-[#00384B] drop-shadow-md">
              Laboratorio: <span className="font-semibold">{lab.nombre}</span>
            </p>
            <p className="text-lg font-bold mb-1 text-[#00384B] drop-shadow-md">
              Estudios:
            </p>
            {Array.isArray(lab.estudios) && lab.estudios.length > 0 ? (
              <ul className="list-disc pl-5 text-[#00384B]">
                {lab.estudios.map((estudio, i) => (
                  <li key={i} className="text-base drop-shadow-sm">
                    {estudio.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-[#00384B] drop-shadow-sm">
                Sin estudios asignados
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={() => {
              //console.log("Cancelar orden con folio:", lab.folioOrden);
            }}
            className="px-6 py-2 text-black font-bold rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 bg-gradient-to-br from-orange-300 to-orange-500"
          >
            <BiXCircle className="inline-block mr-1 mb-1" />
            Cancelar orden
          </button>
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* Fondo animado y degradado */}
      <div className="min-h-screen w-full flex flex-col items-center p-8 bg-gradient-to-br from-[#EAFFFE] to-[#CBFFFE]">
        {/* Encabezado y botón de regresar */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-[#00A7D0] text-[#EAFFFE] rounded-lg hover:bg-[#0084A9] transition transform hover:scale-105"
          >
            <FaArrowLeft className="animate-bounce" />
            <span>Regresar</span>
          </button>
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-[#00384B] drop-shadow-lg">
            Resultados de Laboratorio
          </h1>
        </div>

        {/* Contenedor principal con efecto glassmorphism */}
        <div
          className="w-full max-w-5xl rounded-3xl shadow-[0_8px_16px_rgba(0,0,0,0.3)] p-8 border backdrop-blur-md animate-fadeIn"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderColor: "#9BFFFF",
          }}
        >
          {/* Formulario de búsqueda */}
          <form
            onSubmit={handleBuscarFolio}
            className="flex flex-col md:flex-row gap-4 items-end mb-6"
          >
            <div className="flex flex-col w-full md:w-auto">
              <label
                htmlFor="folio"
                className="text-lg font-semibold mb-1 text-[#00576A] drop-shadow-sm"
              >
                Folio del Laboratorio
              </label>
              <input
                id="folio"
                type="text"
                value={folio}
                onChange={handleFolioChange}
                placeholder="Ingresa el folio..."
                className="px-4 py-2 rounded-full border w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#00E6FF] text-black transition-all duration-300 shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                style={{ borderColor: "#00E6FF" }}
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#00CEFF] to-[#00BFFF] text-black"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <FaSearch />
              )}
              <span>Buscar</span>
            </button>
          </form>

          {/* Mensaje de error */}
          {error && (
            <div
              className="mb-4 p-4 rounded-2xl border shadow-[0_4px_8px_rgba(0,0,0,0.3)] backdrop-blur-md font-semibold text-[#00576A] drop-shadow-sm"
              style={{
                backgroundColor: "rgba(234,255,254,0.5)",
                borderColor: "#00E6FF",
              }}
            >
              {error}
            </div>
          )}

          {/* Datos del laboratorio */}
          {laboratorio && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {renderDato(
                  <FaCalendarAlt />,
                  "Fecha de Emisión",
                  laboratorio.FECHA_EMISION
                )}
                {renderDato(
                  <FaCalendarCheck />,
                  "Fecha de Cita",
                  laboratorio.FECHA_CITA
                )}
                {renderDato(
                  <FaUser />,
                  "Nombre del Paciente",
                  laboratorio.NOMBRE_PACIENTE
                )}
                {renderDato(<FaBirthdayCake />, "Edad", laboratorio.EDAD)}
                {renderDato(
                  <FaNotesMedical />,
                  "Diagnóstico",
                  laboratorio.DIAGNOSTICO
                )}
                {renderDato(
                  <FaBuilding />,
                  "Departamento",
                  laboratorio.DEPARTAMENTO
                )}
                {renderDato(<FaIdCard />, "Empleado", laboratorio.ESEMPLEADO)}
                {renderDato(
                  <FaHandshake />,
                  "Sindicato",
                  laboratorio.SINDICATO
                )}
                {renderDato(
                  <FaStethoscope />,
                  "Médico (Proveedor)",
                  laboratorio.NOMBREPROVEEDOR
                )}
                {renderDato(<FaMoneyCheckAlt />, "Nómina", laboratorio.NOMINA)}
                {renderLaboratorios(laboratorio.laboratorios)}
                {renderEstudios(laboratorio.ESTUDIOS)}
              </div>

              {/* Si la propiedad URL_RESULTADOS existe y no es null, se muestra la previsualización del PDF */}
              {laboratorio.URL_RESULTADOS ? (
                renderPDF(laboratorio.URL_RESULTADOS)
              ) : (
                //! Si aún no se subió el PDF, muestra la sección para subirlo con un toque extra en el botón
                <div
                  className="mt-8 p-6 rounded-2xl border shadow-[0_8px_16px_rgba(0,0,0,0.3)] bg-white/25 backdrop-blur-md transition-all duration-500"
                  style={{ borderColor: "#00E6FF" }}
                >
                  <h2 className="text-xl font-extrabold mb-6 text-[#00576A] drop-shadow-md">
                    Subir Resultados en PDF
                  </h2>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full mb-6 text-black rounded-full border-2 border-transparent focus:border-[#00E6FF] focus:outline-none focus:ring-2 focus:ring-[#00E6FF] transition-all duration-300 shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-3"
                  />
                  <button
                    onClick={handleUploadPDF}
                    disabled={!pdfFile || isUploading}
                    className="flex items-center justify-center gap-3 px-10 py-4 text-lg font-bold rounded-full bg-gradient-to-br from-[#00E6FF] to-[#00BFFF] shadow-[0_6px_12px_rgba(0,0,0,0.3)] hover:from-[#00C5FF] hover:to-[#00AFFF] hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <>
                        <span>Subir PDF</span>
                        {/* Puedes incluir un ícono opcional */}
                        <FaUpload className="text-xl" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
      `}</style>
    </>
  );
}
