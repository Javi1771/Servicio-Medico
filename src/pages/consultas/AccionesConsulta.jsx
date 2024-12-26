/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Cookies from "js-cookie";
import { FormularioContext } from "/src/context/FormularioContext";

const MySwal = withReactContent(Swal);

const AccionesConsulta = ({
  claveConsulta,
  limpiarFormulario,
  guardarMedicamentos,
  guardarPaseEspecialidad,
  guardarIncapacidades,
  guardarHistorialConsultas,
  guardarEnfermedadesCronicas,
  guardarAntecedentes,
}) => {
  const { todosCompletos } = useContext(FormularioContext);

  const limpiarCacheLocalStorage = () => {
    console.log("🧹 Limpiando localStorage...");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
  };

  const guardarDatosAdicionales = async () => {
    try {
      console.log("📤 Guardando datos adicionales...");
      const diagnostico = localStorage.getItem("diagnosticoTexto") || "";
      const motivoConsulta = localStorage.getItem("motivoConsultaTexto") || "";
      const claveUsuarioCookie = Cookies.get("claveusuario");
      const claveusuario = claveUsuarioCookie
        ? parseInt(claveUsuarioCookie, 10)
        : null;

      if (!diagnostico || !motivoConsulta) {
        throw new Error("El diagnóstico y el motivo de consulta son obligatorios.");
      }

      const response = await fetch(
        "/api/pacientes-consultas/diagnostico_observaciones_guardar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta,
            diagnostico,
            motivoconsulta: motivoConsulta,
            claveusuario,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al guardar los datos adicionales.");
      }

      console.log("✅ Datos adicionales guardados correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar datos adicionales:", error);
      throw error;
    }
  };

  const handleGuardarGlobal = async () => {
    try {
      console.log("📤 Iniciando guardado global...");
      console.log("Clave de consulta:", claveConsulta);
      console.log("Estado de todosCompletos:", todosCompletos);

      const resultados = await Promise.allSettled([
        guardarDatosAdicionales(),
        guardarMedicamentos ? guardarMedicamentos() : Promise.resolve(),
        guardarPaseEspecialidad ? guardarPaseEspecialidad() : Promise.resolve(),
        guardarIncapacidades ? guardarIncapacidades() : Promise.resolve(),
        guardarHistorialConsultas
          ? guardarHistorialConsultas()
          : Promise.resolve(),
        guardarEnfermedadesCronicas
          ? guardarEnfermedadesCronicas()
          : Promise.resolve(),
        guardarAntecedentes ? guardarAntecedentes() : Promise.resolve(),
      ]);

      console.log("📄 Resultados de las funciones de guardado:", resultados);

      const errores = resultados.filter((result) => result.status === "rejected");
      if (errores.length > 0) {
        console.error("❌ Errores en el guardado:", errores);
        throw new Error("Hubo errores al guardar algunos datos.");
      }

      await actualizarClavestatus(2);

      console.log("✅ Todos los datos guardados correctamente.");

      limpiarCacheLocalStorage();
      limpiarFormulario();

      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Guardado exitoso</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Todos los datos se han guardado correctamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText: "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
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
        html: `<p style='color: #fff; font-size: 1.1em;'>${error.message || "Hubo un problema al guardar los datos. Inténtalo nuevamente."}</p>`,
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

  const actualizarClavestatus = async (nuevoEstatus) => {
    try {
      const response = await fetch(
        "/api/pacientes-consultas/actualizarClavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claveConsulta, clavestatus: nuevoEstatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          `❌ Error al actualizar clavestatus a ${nuevoEstatus}:`,
          data.message
        );
        throw new Error(data.message);
      }

      console.log(`✅ Clavestatus actualizado exitosamente a ${nuevoEstatus}:`, data.message);
    } catch (error) {
      throw new Error(`Error al actualizar clavestatus: ${error.message}`);
    }
  };

  const handleCancelar = async () => {
    try {
      console.log("📤 Enviando solicitud para cancelar la consulta...");

      await actualizarClavestatus(0);

      limpiarCacheLocalStorage();
      limpiarFormulario();

      MySwal.fire({
        icon: "info",
        title:
          "<span style='color: #00bcd4; font-weight: bold; font-size: 1.5em;'>ℹ️ Consulta cancelada</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Consulta cancelada y datos borrados correctamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00bcd4",
        confirmButtonText: "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error al cancelar y borrar datos de la consulta:", error);

      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cancelar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error al cancelar la consulta. Inténtalo nuevamente.</p>",
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

  return (
    <div className="flex space-x-2 md:space-x-4 mt-4">
      <button
        onClick={handleGuardarGlobal}
        disabled={!todosCompletos}
        className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold tracking-wide transition duration-300 ease-in-out transform hover:scale-105 shadow-lg ${
          todosCompletos
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        Guardar Todo
      </button>
      <button
        onClick={handleCancelar}
        className="px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold tracking-wide transition duration-300 ease-in-out transform hover:scale-105 shadow-lg bg-red-500 text-white hover:bg-red-600"
      >
        Cancelar
      </button>
    </div>
  );
};

export default AccionesConsulta;
