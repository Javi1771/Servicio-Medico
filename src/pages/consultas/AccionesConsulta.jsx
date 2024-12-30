/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Cookies from "js-cookie";
import { FormularioContext } from "/src/context/FormularioContext";

const MySwal = withReactContent(Swal);

const AccionesConsulta = ({
  claveConsulta,
  limpiarFormulario,
  clavepaciente,
  clavenomina,
}) => {
  const { todosCompletos, formulariosCompletos } =
    useContext(FormularioContext);
  const [prioridad, setPrioridad] = useState("");

  // Verificación de props
  useEffect(() => {
    console.log("Props recibidas en AccionesConsulta:", {
      claveConsulta,
      limpiarFormulario,
      clavepaciente,
      clavenomina,
    });

    if (!claveConsulta) console.warn("⚠️ claveConsulta no está definido.");
    if (!clavepaciente) console.warn("⚠️ clavepaciente no está definido.");
    if (!clavenomina) console.warn("⚠️ clavenomina no está definido.");
  }, [claveConsulta, limpiarFormulario, clavepaciente, clavenomina]);

  // Tooltip para formularios incompletos
  const tooltipFaltante = () => {
    const nombresLegibles = {
      DatosAdicionales: "Diagnóstico",
      Medicamentos: "Medicamentos",
      PaseEspecialidad: "Pase a Especialidad",
      Incapacidades: "Incapacidades",
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
      description: `Faltan los siguientes formularios: ${faltantes.join(
        ", "
      )}.`,
      icon: "⚠️",
    };
  };

  // Limpieza de localStorage
  const limpiarCacheLocalStorage = () => {
    console.log("🧹 Limpiando localStorage...");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
    localStorage.removeItem("PaseEspecialidad");
    localStorage.removeItem("medicamentos");
  };

  // Guardar datos adicionales
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
        throw new Error(
          "El diagnóstico y el motivo de consulta son obligatorios."
        );
      }

      console.log("🔍 Datos enviados al backend (datos adicionales):", {
        claveConsulta,
        diagnostico,
        motivoConsulta,
        claveusuario,
      });

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
        throw new Error(
          error.message || "Error al guardar los datos adicionales."
        );
      }

      console.log("✅ Datos adicionales guardados correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar datos adicionales:", error);
      throw error;
    }
  };

  // Guardar medicamentos
  const guardarMedicamentos = async () => {
    try {
      console.log("📤 Guardando medicamentos...");

      const cachedMedicamentos = localStorage.getItem("medicamentos") || "[]";
      const medicamentos = JSON.parse(cachedMedicamentos);

      if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        throw new Error("No hay medicamentos para guardar.");
      }

      // Validar y mapear medicamentos
      const medicamentosMapeados = medicamentos.map((medicamento, index) => {
        if (!medicamento.medicamento || !medicamento.tratamiento) {
          throw new Error(`Faltan datos en el medicamento ${index + 1}`);
        }
        return {
          folioReceta: parseInt(claveConsulta, 10), // Convertir a número
          descMedicamento: parseInt(medicamento.medicamento, 10), // Convertir a número
          indicaciones: medicamento.indicaciones.trim(), // Cadena opcional
          cantidad: medicamento.tratamiento.trim(), // Cadena
        };
      });

      console.log(
        "🔍 Medicamentos preparados para enviar al backend:",
        medicamentosMapeados
      );

      const response = await fetch("/api/medicamentos/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamentosMapeados),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Error del backend al guardar medicamentos:", error);
        throw new Error(error.error || "Error al guardar medicamentos.");
      }

      console.log("✅ Medicamentos guardados correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar medicamentos:", error);
      throw error;
    }
  };

  // Sincronización de prioridad al cambiar selección
  useEffect(() => {
    const cachedEspecialidad = localStorage.getItem(
      `PaseEspecialidad:${claveConsulta}`
    );
    if (cachedEspecialidad) {
      const parsedEspecialidad = JSON.parse(cachedEspecialidad);
      if (parsedEspecialidad.prioridad) {
        console.log(
          "🔄 Sincronizando prioridad al montar:",
          parsedEspecialidad.prioridad
        );
        setPrioridad(parsedEspecialidad.prioridad);
      } else {
        console.warn("⚠️ Prioridad no encontrada en localStorage.");
      }
    }
  }, [claveConsulta]);

  // Guardar pase a especialidad
  const guardarPaseEspecialidad = async () => {
    try {
      console.log("📤 Guardando pase a especialidad...");

      const cachedEspecialidad = JSON.parse(
        localStorage.getItem(`PaseEspecialidad:${claveConsulta}`) || "{}"
      );

      const paseEspecialidadPayload = {
        claveConsulta: String(claveConsulta),
        seasignoaespecialidad:
          cachedEspecialidad.pasarEspecialidad === "no" ? "N" : "S",
        claveEspecialidad:
          cachedEspecialidad.pasarEspecialidad === "no"
            ? null
            : cachedEspecialidad.especialidadSeleccionada,
        observaciones:
          cachedEspecialidad.pasarEspecialidad === "no"
            ? null
            : cachedEspecialidad.observaciones,
        prioridad:
          cachedEspecialidad.pasarEspecialidad === "no"
            ? null
            : cachedEspecialidad.prioridad,
        clavenomina: String(clavenomina),
        clavepaciente: String(clavepaciente),
      };

      console.log(
        "🔍 Datos preparados para el backend (pase a especialidad):",
        paseEspecialidadPayload
      );

      const response = await fetch("/api/especialidades/guardarEspecialidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paseEspecialidadPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(
          "❌ Error del servidor al guardar pase a especialidad:",
          error
        );
        throw new Error(
          error.message || "Error al guardar pase a especialidad."
        );
      }

      console.log("✅ Pase a especialidad guardado correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar pase a especialidad:", error);
      throw error;
    }
  };

  // Actualizar clavestatus
  const actualizarClavestatus = async (nuevoEstatus) => {
    try {
      console.log("📤 Actualizando clavestatus a:", nuevoEstatus);
      const response = await fetch(
        "/api/pacientes-consultas/actualizarClavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claveConsulta, clavestatus: nuevoEstatus }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el estatus.");
      }

      console.log(`✅ Clavestatus actualizado exitosamente a ${nuevoEstatus}.`);
    } catch (error) {
      console.error("❌ Error al actualizar clavestatus:", error);
      throw error;
    }
  };

  // Guardado global
  const handleGuardarGlobal = async () => {
    try {
      console.log("📤 Iniciando guardado global...");
      console.log("🔍 Clave de consulta:", claveConsulta);
      console.log(
        "🔧 Prioridad antes de guardar pase a especialidad en handleGuardarGlobal:",
        prioridad
      );

      const resultados = await Promise.allSettled([
        guardarDatosAdicionales(),
        guardarMedicamentos(),
        guardarPaseEspecialidad(),
      ]);

      console.log("📄 Resultados de las operaciones de guardado:", resultados);

      const errores = resultados.filter(
        (result) => result.status === "rejected"
      );
      if (errores.length > 0) {
        throw new Error("Hubo errores al guardar algunos datos.");
      }

      await actualizarClavestatus(2);

      limpiarCacheLocalStorage();
      limpiarFormulario();

      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Guardado exitoso</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Todos los datos se han guardado correctamente.</p>",
      });
    } catch (error) {
      console.error("❌ Error durante el guardado global:", error);

      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error en el guardado</span>",
        html: `<p style='color: #fff; font-size: 1.1em;'>${
          error.message ||
          "Hubo un problema al guardar los datos. Inténtalo nuevamente."
        }</p>`,
      });
    }
  };

  const tooltipData = tooltipFaltante();

  return (
    <div className="flex space-x-4 mt-4">
      <div className="relative inline-block group">
        <button
          onClick={() => {
            const cachedEspecialidad = localStorage.getItem(
              `PaseEspecialidad:${claveConsulta}`
            );
            if (cachedEspecialidad) {
              const parsedEspecialidad = JSON.parse(cachedEspecialidad);
              if (parsedEspecialidad.prioridad) {
                setPrioridad(parsedEspecialidad.prioridad);
              }
            }
            console.log(
              "🔧 Prioridad sincronizada antes de guardar en el botón Guardar Todo:",
              prioridad
            );
            handleGuardarGlobal();
          }}
          disabled={!todosCompletos}
          className={`relative px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 overflow-hidden ${
            todosCompletos
              ? "bg-green-600/90 hover:bg-green-700/90 focus:outline-none"
              : "bg-gray-600/90 cursor-not-allowed"
          }`}
        >
          Guardar Todo
        </button>
        <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 transition-all duration-300 ease-in-out transform group-hover:translate-y-0 translate-y-2">
          <div className="relative p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                <span className="text-lg">{tooltipData.icon}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {tooltipData.title}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-300">{tooltipData.description}</p>
            </div>

            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 blur-xl opacity-50"></div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rotate-45 border-r border-b border-white/10"></div>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          actualizarClavestatus(0);
          limpiarFormulario();
        }}
        className="px-6 py-3 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all duration-300"
      >
        Cancelar
      </button>
    </div>
  );
};

export default AccionesConsulta;
