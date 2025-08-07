/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useRouter } from "next/router";
import { FaClipboardList, FaSearch } from "react-icons/fa";
import { BiCategory, BiXCircle } from "react-icons/bi";
import { CiBarcode } from "react-icons/ci";
import { showCustomAlert } from "../../utils/alertas";
import PaseEspecialidad from "./components/PaseEspecialidad";
import Laboratorio from "./components/Laboratorio";
import Incapacidad from "./components/Incapacidad";
import Surtimiento from "./components/Surtimiento";

const red50 = "#FFF0F0";
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

export default function CancelarOrden() {
  const router = useRouter();
  const [tipo, setTipo] = useState("paseEspecialidad");
  const [folio, setFolio] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleBuscar = async () => {
    setDatos(null);
    setCargando(true);

    const endpoints = {
      paseEspecialidad: "/api/cancelaciones/buscarConsulta",
      laboratorio: "/api/cancelaciones/buscarLaboratorio",
      incapacidad: "/api/cancelaciones/buscarIncapacidad",
      surtimiento: "/api/cancelaciones/buscarSurtimiento",
    };

    try {
      const res = await fetch(endpoints[tipo], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ folio, tipo }),
      });

      //* Parseamos JSON *siempre* (si viene HTML explotará aquí)
      let result = await res.json();

      if (!res.ok) {
        // **Sin fallback**: mostramos SOLO el message del endpoint
        await showCustomAlert(
          "warning",
          "Advertencia",
          result.message,
          "Aceptar"
        );
        return;
      }

      //* OK, pintamos datos
      setDatos(result.data);
    } catch (error) {
      // Si aquí entra es porque el `await res.json()` reventó
      // (es decir, NO vino JSON, vino HTML u otro error)
      // En ese caso tu servidor NO te está devolviendo tu JSON de error:
      // asegúrate de tener un catch-all en pages/api/cancelaciones
      // para que siempre entregue JSON (incluso en rutas no definidas).

      await showCustomAlert(
        "error",
        "Error inesperado",
        "No se recibió respuesta, verifique el folio e intente nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = async () => {
    const endpoints = {
      paseEspecialidad: "/api/cancelaciones/cancelarConsulta",
      laboratorio: "/api/cancelaciones/cancelarOrden",
      incapacidad: "/api/cancelaciones/cancelarIncapacidad",
      surtimiento: "/api/cancelaciones/cancelarSurtimiento",
    };
    try {
      const res = await fetch(endpoints[tipo], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio, tipo }),
      });
      const result = await res.json();
      if (!res.ok) {
        await showCustomAlert(
          "error",
          "Error al cancelar",
          result.message || "Error al cancelar la solicitud",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "success",
          "Cancelación exitosa",
          result.message || "La solicitud ha sido cancelada correctamente",
          "Aceptar"
        );
        setDatos(null);
        setFolio("");
      }
    } catch (error) {
      await showCustomAlert(
        "error",
        "Error al cancelar",
        error.message || "Ocurrió un error al intentar cancelar la solicitud",
        "Aceptar"
      );
    }
  };

  const handleConfirmCancel = async () => {
    await showCustomAlert(
      "warning",
      "Confirmar Cancelación",
      "¿Seguro que deseas cancelar esta solicitud?",
      "Sí, cancelar",
      {
        background: "linear-gradient(145deg, #7f6000, #332600)",
        showCancelButton: true,
        confirmButtonColor: "#ffc107",
        cancelButtonColor: "#666",
        cancelButtonText: "No, mantener",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,193,7,0.9)] rounded-lg",
        },
      }
    ).then((result) => {
      if (result.isConfirmed) handleCancelar();
    });
  };

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
          <div className="loader-overlay"></div>
        </div>
      )}

      <button
        onClick={() => router.replace("/inicio-servicio-medico")}
        className="absolute top-4 left-4 px-6 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center group border-2 border-red-400 hover:scale-105 hover:shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${red300}, ${red200})`,
          color: red950,
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        <BiXCircle className="mr-2 text-xl group-hover:scale-125 transition-transform duration-300" />
        <span className="tracking-wide">Regresar</span>
      </button>

      <div
        className="w-full max-w-4xl rounded-3xl p-10 shadow-2xl border"
        style={{
          background: `linear-gradient(135deg, ${red200}, ${red300})`,
          borderColor: red400,
        }}
      >
        <h1
          className="text-5xl font-extrabold text-center mb-10"
          style={{ color: red700 }}
        >
          <FaClipboardList className="inline-block mr-2" /> Cancelaciones
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <label
              className="block text-xl font-semibold mb-2"
              style={{ color: red900 }}
            >
              <BiCategory className="inline-block mr-2" /> ¿Qué quieres
              cancelar?:
            </label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setDatos(null);
              }}
              className="w-full p-4 rounded-lg shadow-md"
              style={{ border: `2px solid ${red400}`, color: red950 }}
            >
              <option value="paseEspecialidad">Pase a Especialidad</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="incapacidad">Incapacidad</option>
              <option value="surtimiento">Surtimiento</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xl font-semibold mb-2"
              style={{ color: red900 }}
            >
              <CiBarcode className="inline-block mr-2" /> Folio de la Consulta:
            </label>
            <input
              type="number"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ingresa el folio de la consulta"
              className="w-full p-4 rounded-lg shadow-md"
              style={{ border: `2px solid ${red400}`, color: red950 }}
            />
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={datos ? handleLimpiar : handleBuscar}
            disabled={cargando || (!folio && !datos)}
            className="px-10 py-4 font-bold rounded-full shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: red500, color: red950, minWidth: "200px" }}
          >
            {cargando ? (
              <>
                <span className="loader w-5 h-5 border-4 border-t-transparent border-red-700 rounded-full animate-spin"></span>
                Buscando...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                {datos ? "Buscar otra nueva" : "Buscar"}
              </>
            )}
          </button>
        </div>

        {datos && (
          <div
            className="mt-8 p-6 rounded-2xl shadow-inner border"
            style={{ backgroundColor: red50, borderColor: red200 }}
          >
            {tipo === "paseEspecialidad" && <PaseEspecialidad datos={datos} />}
            {tipo === "laboratorio" && (
              <Laboratorio
                datos={datos}
                onCancelSuccess={() => {
                  setDatos(null);
                  setFolio("");
                }}
              />
            )}
            {tipo === "incapacidad" && <Incapacidad datos={datos} />}
            {tipo === "surtimiento" && <Surtimiento datos={datos} />}

            {tipo !== "laboratorio" && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleConfirmCancel}
                  className="px-8 py-4 font-bold rounded-full shadow-2xl flex items-center"
                  style={{ background: red600, color: "#fff" }}
                >
                  <BiXCircle className="mr-2" />
                  Cancelar {tipo === "surtimiento" ? "Orden" : "Consulta"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .loader {
          border: 4px solid #ffc2c2;
          border-top: 4px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
