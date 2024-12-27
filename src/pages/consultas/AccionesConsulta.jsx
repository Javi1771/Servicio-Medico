/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FormularioContext } from "/src/context/FormularioContext";

const MySwal = withReactContent(Swal);

const AccionesConsulta = ({ claveConsulta, limpiarFormulario }) => {
  const { todosCompletos, formulariosCompletos } = useContext(FormularioContext);

  const tooltipFaltante = () => {
    const nombresLegibles = {
      DatosAdicionales: "Diagnóstico",
      Medicamentos: "Medicamentos",
      // Agrega más mapeos según sea necesario
    };

    const faltantes = Object.entries(formulariosCompletos)
      .filter(([, completo]) => !completo)
      .map(([pantalla]) => nombresLegibles[pantalla] || pantalla);

    if (faltantes.length === 0) {
      return {
        title: "¡Todo está completo!",
        description: "Todos los formularios están listos para guardar.",
        icon: "🎉",
      };
    }

    return {
      title: "Formularios incompletos",
      description: `Faltan los siguientes formularios: ${faltantes.join(", ")}.`,
      icon: "⚠️",
    };
  };

  const actualizarClavestatus = async (estatus) => {
    try {
      const response = await fetch(
        "/api/pacientes-consultas/actualizarClavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claveConsulta, clavestatus: estatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar clavestatus.");
      }

      console.log("Clavestatus actualizado exitosamente.");
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Actualización Exitosa</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>El estatus se actualizó correctamente.</p>",
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
      console.error("Error al actualizar el estatus:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al actualizar el estatus</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo actualizar el estatus. Intenta nuevamente.</p>",
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

  const handleGuardarGlobal = async () => {
    try {
      console.log("📤 Iniciando guardado global...");
      await actualizarClavestatus(2); // Cambiar clavestatus a 2
      limpiarFormulario();

      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Guardado exitoso</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Todos los datos se han guardado correctamente.</p>",
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
      console.error("❌ Error durante el guardado global:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error en el guardado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar los datos. Inténtalo nuevamente.</p>",
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

  const tooltipData = tooltipFaltante();

  return (
    <div className="flex space-x-4 mt-4">
      <div className="relative inline-block group">
        <button
          onClick={handleGuardarGlobal}
          disabled={!todosCompletos}
          className={`relative px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 overflow-hidden ${
            todosCompletos
              ? "bg-green-600/90 hover:bg-green-700/90 focus:outline-none"
              : "bg-gray-600/90 cursor-not-allowed"
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              todosCompletos
                ? "from-green-500/20 to-teal-500/20"
                : "from-gray-500/20 to-gray-700/20"
            } blur-xl group-hover:opacity-75 transition-opacity`}
          ></div>
          <span className="relative">Guardar Todo</span>
        </button>
        <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2">
          <div className="relative p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                <span className="text-green-400 text-lg">
                  {tooltipData.icon}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {tooltipData.title}
              </h3>
            </div>
            <p className="text-sm text-gray-300">{tooltipData.description}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          actualizarClavestatus(0);
          limpiarFormulario();
        }}
        className="relative px-6 py-3 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-xl"></div>
        <span className="relative">Cancelar</span>
      </button>
    </div>
  );
};

export default AccionesConsulta;
