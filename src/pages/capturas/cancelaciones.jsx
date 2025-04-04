/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaClipboardList, FaSearch } from "react-icons/fa";
import { BiCategory, BiXCircle } from "react-icons/bi";
import { CiBarcode } from "react-icons/ci";

// Importamos nuestros subcomponentes (asegúrate de que las rutas sean correctas)
import PaseEspecialidad from "./components/PaseEspecialidad";
import Laboratorio from "./components/Laboratorio";
import Incapacidad from "./components/Incapacidad";
import Surtimiento from "./components/Surtimiento";

const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

// Paleta de rojos
const red50  = "#FFF0F0";
const red100 = "#FFDDDD";
const red200 = "#FFC0C0";
const red300 = "#FF9494";
const red400 = "#FF7577";
const red500 = "#FF2B33";
const red600 = "#FF0000";
const red700 = "#D70000";
const red800 = "#B10033";
const red900 = "#920A1A";
const red950 = "#500000";

const MySwal = withReactContent(Swal);

export default function CancelarOrden() {
  const router = useRouter();
  // Inicializamos con el primer tipo disponible (en este caso "paseEspecialidad")
  const [tipo, setTipo] = useState("paseEspecialidad");
  const [folio, setFolio] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Función para reproducir sonido
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  // Función para mostrar alertas con estilo neon
  const showAlert = (icon, title, message) => {
    if (icon === "warning") {
      playSound(false);
      MySwal.fire({
        icon: "warning",
        title: `<span style="color: #ffbb33; font-weight: bold; font-size: 1.5em;">${title}</span>`,
        html: `<p style="color: #fff; font-size: 1.1em;">${message}</p>`,
        background: "linear-gradient(145deg, #664d00, #332600)",
        confirmButtonColor: "#ffbb33",
        confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-yellow-500 shadow-[0px_0px_20px_5px_rgba(255,187,51,0.9)] rounded-lg",
        },
      });
    } else if (icon === "success") {
      playSound(true);
      MySwal.fire({
        icon: "success",
        title: `<span style="color: #4caf50; font-weight: bold; font-size: 1.5em;">${title}</span>`,
        html: `<p style="color: #fff; font-size: 1.1em;">${message}</p>`,
        background: "linear-gradient(145deg, #003d00, #001f00)",
        confirmButtonColor: "#4caf50",
        confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,255,0,0.9)] rounded-lg",
        },
      });
    } else if (icon === "error") {
      playSound(false);
      MySwal.fire({
        icon: "error",
        title: `<span style="color: #ff1744; font-weight: bold; font-size: 1.5em;">${title}</span>`,
        html: `<p style="color: #fff; font-size: 1.1em;">${message}</p>`,
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    }
  };

  // Función para buscar datos según el tipo (incluye surtimiento)
  const handleBuscar = async () => {
    setDatos(null);
    setCargando(true);
    let endpoint = "";
    if (tipo === "paseEspecialidad") {
      endpoint = "/api/cancelaciones/buscarConsulta";
    } else if (tipo === "laboratorio") {
      endpoint = "/api/cancelaciones/buscarLaboratorio";
    } else if (tipo === "incapacidad") {
      endpoint = "/api/cancelaciones/buscarIncapacidad";
    } else if (tipo === "surtimiento") {
      endpoint = "/api/cancelaciones/buscarSurtimiento";
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio, tipo }),
      });
      const result = await res.json();
      if (!res.ok) {
        showAlert("warning", "Advertencia", result.message || "Error al buscar la información");
      } else {
        setDatos(result.data);
      }
    } catch (error) {
      showAlert("error", "Error", error.message);
    }
    setCargando(false);
  };

  // Función para cancelar según el tipo (incluye surtimiento)
  const handleCancelar = async () => {
    let endpoint = "";
    if (tipo === "paseEspecialidad") {
      endpoint = "/api/cancelaciones/cancelarConsulta";
    } else if (tipo === "laboratorio") {
      endpoint = "/api/cancelaciones/cancelarOrden";
    } else if (tipo === "incapacidad") {
      endpoint = "/api/cancelaciones/cancelarIncapacidad";
    } else if (tipo === "surtimiento") {
      endpoint = "/api/cancelaciones/cancelarSurtimiento";
    }
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio, tipo }),
      });
      const result = await res.json();
      if (!res.ok) {
        showAlert("error", "Error", result.message || "Error al cancelar");
      } else {
        showAlert("success", "¡Cancelado!", result.message);
        setDatos(null);
        setFolio("");
      }
    } catch (error) {
      showAlert("error", "Error", error.message);
    }
  };

  // Función para la confirmación de cancelación
  const handleConfirmCancel = () => {
    MySwal.fire({
      title: `<span style="color: #ffbb33; font-weight: bold; font-size: 1.5em;">Confirmar Cancelación</span>`,
      html: `<p style="color: #fff; font-size: 1.1em;">¿Estás seguro de que deseas cancelar esta solicitud?</p>`,
      icon: "warning",
      background: "linear-gradient(145deg, #664d00, #332600)",
      showCancelButton: true,
      confirmButtonColor: "#ff1744",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Sí, cancelar</span>",
      cancelButtonText: "<span style='color: #fff; font-weight: bold;'>No, mantener</span>",
      customClass: {
        popup: "border border-yellow-500 shadow-[0px_0px_20px_5px_rgba(255,187,51,0.9)] rounded-lg",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        handleCancelar();
      }
    });
  };

  // Función para limpiar la pantalla
  const handleLimpiar = () => {
    setDatos(null);
    setFolio("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 relative"
      style={{
        background: `radial-gradient(circle at center, ${red50} 0%, ${red100} 100%)`,
      }}
    >
      {cargando && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="loader"></div>
        </div>
      )}

      <div className="w-full max-w-4xl relative transition-transform duration-300 hover:scale-105">
        <div
          className="absolute inset-0 rounded-3xl backdrop-blur-md"
          style={{ border: `3px solid ${red400}`, opacity: 0.5 }}
        />
        <div
          className="relative rounded-3xl p-10 shadow-2xl border"
          style={{
            background: `linear-gradient(135deg, ${red200}, ${red300})`,
            borderColor: red400,
          }}
        >
          <h1
            className="text-5xl font-extrabold text-center mb-10 tracking-wide animate__animated animate__fadeInDown"
            style={{
              color: red700,
              textShadow: `0 0 6px ${red600}`,
            }}
          >
            <FaClipboardList className="inline-block mr-2" /> Panel de Cancelaciones
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <label className="block text-xl font-semibold mb-2" style={{ color: red900 }}>
                <BiCategory className="inline-block mr-2" /> Tipo:
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setDatos(null);
                }}
                className="w-full p-4 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-300"
                style={{
                  color: red950,
                  background: "linear-gradient(145deg, #fff, #f9f9f9)",
                  border: `2px solid ${red400}`,
                  boxShadow: `inset 0 0 8px ${red100}`,
                }}
              >
                {/* Se elimina la opción de "consultaGeneral" */}
                <option value="paseEspecialidad">Pase a Especialidad</option>
                <option value="laboratorio">Estudio de Laboratorio</option>
                <option value="incapacidad">Incapacidad</option>
                <option value="surtimiento">Surtimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-xl font-semibold mb-2" style={{ color: red900 }}>
                <CiBarcode className="inline-block mr-2" /> Folio de Consulta:
              </label>
              <input
                type="number"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ingresa el folio o clave"
                className="w-full p-4 rounded-lg shadow-md focus:outline-none focus:ring-4 transition-colors duration-300"
                style={{
                  color: red950,
                  background: "linear-gradient(145deg, #fff, #f9f9f9)",
                  border: `2px solid ${red400}`,
                  boxShadow: `inset 0 0 8px ${red100}`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
            <button
              onClick={handleBuscar}
              disabled={cargando || !folio}
              className="px-10 py-4 font-bold text-white rounded-full shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              style={{
                background: `linear-gradient(90deg, ${red500}, ${red600})`,
                boxShadow: `0 0 10px ${red400}`,
                textShadow: `0 0 4px ${red200}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(90deg, ${red600}, ${red500})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(90deg, ${red500}, ${red600})`;
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(3px)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FaSearch className="mr-2" /> {cargando ? "Buscando..." : "Buscar"}
            </button>

            {datos ? (
              <button
                onClick={handleLimpiar}
                className="px-10 py-4 font-bold text-white rounded-full shadow-xl transition-all duration-300 flex items-center"
                style={{
                  background: `linear-gradient(90deg, ${red300}, ${red400})`,
                  boxShadow: `0 0 10px ${red200}`,
                  textShadow: `0 0 4px ${red100}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red400}, ${red300})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red300}, ${red400})`;
                }}
              >
                Buscar una nueva
              </button>
            ) : (
              <button
                onClick={() => router.push("/inicio-servicio-medico")}
                className="px-10 py-4 font-bold text-white rounded-full shadow-xl transition-all duration-300 flex items-center"
                style={{
                  background: `linear-gradient(90deg, ${red300}, ${red400})`,
                  boxShadow: `0 0 10px ${red200}`,
                  textShadow: `0 0 4px ${red100}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red400}, ${red300})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red300}, ${red400})`;
                }}
              >
                Regresar
              </button>
            )}
          </div>

          {datos && (
            <div
              className="mt-8 p-6 rounded-2xl shadow-inner border transition-all duration-500 animate__animated animate__fadeInUp"
              style={{
                backgroundColor: red50,
                borderColor: red200,
              }}
            >
              <h2
                className="text-3xl font-bold mb-6"
                style={{
                  color: red900,
                  textShadow: `0 0 4px ${red700}`,
                }}
              >
                Detalles Encontrados
              </h2>
              {tipo === "paseEspecialidad" && <PaseEspecialidad datos={datos} />}
              {tipo === "laboratorio" && <Laboratorio datos={datos} />}
              {tipo === "incapacidad" && <Incapacidad datos={datos} />}
              {tipo === "surtimiento" && <Surtimiento datos={datos} />}
            </div>
          )}

          {datos && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleConfirmCancel}
                className="px-8 py-4 text-white font-bold rounded-full shadow-2xl transition-transform duration-300 flex items-center"
                style={{
                  background: `linear-gradient(90deg, ${red600}, ${red700})`,
                  boxShadow: `0 0 10px ${red400}`,
                  textShadow: `0 0 4px ${red200}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red700}, ${red600})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(90deg, ${red600}, ${red700})`;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(3px)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <BiXCircle className="mr-2" />
                {tipo === "laboratorio" || tipo === "surtimiento"
                  ? "Cancelar Orden"
                  : "Cancelar Consulta"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .loader {
          border: 8px solid #f3f3f3;
          border-top: 8px solid ${red600};
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
