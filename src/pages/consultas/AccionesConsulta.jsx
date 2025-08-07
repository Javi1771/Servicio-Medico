/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { showCustomAlert } from "../../utils/alertas";

import Cookies from "js-cookie";
import { FormularioContext } from "/src/context/FormularioContext";

//* ============  🔹 HELPER PARA FORMATEAR FECHAS 🔹  ============ */
const normalizeDateForSQL = (value, start) => {
  if (!value) return null;
  if (typeof value === "string" && !value.includes("T")) return value;
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${start ? "00:00:00.000" : "23:59:00.000"}`
  );
};
//* ============================================================= */

const AccionesConsulta = ({
  claveConsulta,
  limpiarFormulario,
  clavepaciente,
  clavenomina,
}) => {
  const { todosCompletos, formulariosCompletos } =
    useContext(FormularioContext);
  const [prioridad, setPrioridad] = useState("");
  const [loading, setLoading] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState({
    title: "Formularios incompletos",
    description: "Algunos formularios no están completos.",
    icon: "⚠️",
  });

  //* Verificación de props
  useEffect(() => {
    // console.log("Props recibidas en AccionesConsulta:", {
    //   claveConsulta,
    //   limpiarFormulario,
    //   clavepaciente,
    //   clavenomina,
    // });

    if (!claveConsulta) console.warn("⚠️ claveConsulta no está definido.");
    if (!clavepaciente) console.warn("⚠️ clavepaciente no está definido.");
    if (!clavenomina) console.warn("⚠️ clavenomina no está definido.");
  }, [claveConsulta, limpiarFormulario, clavepaciente, clavenomina]);

  useEffect(() => {
    setTooltipMessage(tooltipFaltante());
  }, [todosCompletos, formulariosCompletos]);

  const router = useRouter();

  //* Tooltip para formularios incompletos
  const tooltipFaltante = () => {
    const nombresLegibles = {
      DatosAdicionales: "Diagnóstico",
      Medicamentos: "Medicamentos",
      PaseEspecialidad: "Pase a Especialidad",
      Incapacidades: "Incapacidades",
    };

    //* Incluye todas las pantallas que no estén completas
    const faltantes = Object.entries(formulariosCompletos)
      .filter(([pantalla, completo]) => !completo)
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

  //* Limpieza de localStorage
  const limpiarCacheLocalStorage = () => {
    //console.log("🧹 Limpiando localStorage...");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
    localStorage.removeItem("PaseEspecialidad");
    localStorage.removeItem("medicamentos");
    localStorage.removeItem("Incapacidad");
    localStorage.removeItem("decisionTomada");
    localStorage.removeItem("alergiasTexto");
  };

  //* Guardar datos adicionales
  const guardarDatosAdicionales = async () => {
    try {
      //console.log("📤 Guardando datos adicionales...");
      const diagnostico = localStorage.getItem("diagnosticoTexto") || "";
      const motivoConsulta = localStorage.getItem("motivoConsultaTexto") || "";
      const alergias = localStorage.getItem("alergiasTexto") || "";
      const claveUsuarioCookie = Cookies.get("claveusuario");
      const claveusuario = claveUsuarioCookie
        ? parseInt(claveUsuarioCookie, 10)
        : null;

      if (!diagnostico || !motivoConsulta) {
        throw new Error(
          "El diagnóstico y el motivo de consulta son obligatorios."
        );
      }

      //console.log("🔍 Datos enviados al backend (datos adicionales):", {
      //   claveConsulta,
      //   diagnostico,
      //   motivoConsulta,
      //   alergias,
      //   claveusuario,
      // });

      const response = await fetch(
        "/api/pacientes-consultas/diagnostico_observaciones_guardar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta,
            diagnostico,
            motivoconsulta: motivoConsulta,
            alergias,
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

      //console.log("✅ Datos adicionales guardados correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar datos adicionales:", error);
      throw error;
    }
  };

  //* Guardar medicamentos
  const guardarMedicamentos = async () => {
    try {
      //console.log("📤 Guardando medicamentos...");

      const cachedMedicamentos = localStorage.getItem("medicamentos") || "[]";
      const decisionTomada = localStorage.getItem("decisionTomada");

      //console.log("🛠️ Decisión tomada al guardar medicamentos:", decisionTomada );
      //console.log("📦 Medicamentos cargados del localStorage:", cachedMedicamentos );

      let medicamentos = [];
      try {
        medicamentos = JSON.parse(cachedMedicamentos);
      } catch (error) {
        console.error(
          "❌ Error al parsear los medicamentos de localStorage:",
          error
        );
        localStorage.setItem("medicamentos", JSON.stringify([])); //! Reiniciar si hay error
        throw new Error("Error al leer los medicamentos almacenados.");
      }

      let medicamentosPayload;
      if (decisionTomada === "no" || !medicamentos.length) {
        medicamentosPayload = {
          folioReceta: claveConsulta,
          decisionTomada: "no",
          medicamentos: [], //! Array vacío
          piezas: 0,
          resurtir: 0,
          mesesResurtir: null,
        };
      } else {
        //* Si la decisión es "si", se valida que existan medicamentos y se arma el payload
        if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
          throw new Error("❌ No hay medicamentos para guardar.");
        }
        medicamentosPayload = {
          folioReceta: claveConsulta,
          decisionTomada,
          medicamentos: medicamentos.map((medicamento) => ({
            descMedicamento: medicamento.medicamento,
            indicaciones: medicamento.indicaciones.trim(),
            cantidad: medicamento.tratamiento.trim(),
            piezas: medicamento.piezas,
            resurtir: medicamento.resurtir === "si" ? 1 : 0,
            mesesResurtir:
              medicamento.resurtir === "si" ? medicamento.mesesResurtir : null,
          })),
        };
      }

      //console.log("📡 Payload preparado para el backend:", medicamentosPayload);

      const response = await fetch("/api/medicamentos/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamentosPayload),
      });

      //console.log("🔄 Respuesta recibida:", response);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error(
          "❌ El servidor respondió con un error no JSON:",
          errorText
        );
        throw new Error(`Respuesta inesperada del servidor: ${errorText}`);
      }

      const responseData = await response.json();
      //console.log("✅ Respuesta JSON recibida correctamente:", responseData);
    } catch (error) {
      console.error("❌ Error al guardar medicamentos:", error);
      throw error;
    }
  };

  //* Sincronización de prioridad al cambiar selección
  useEffect(() => {
    const cachedEspecialidad = localStorage.getItem(
      `PaseEspecialidad:${claveConsulta}`
    );
    if (cachedEspecialidad) {
      const parsedEspecialidad = JSON.parse(cachedEspecialidad);
      if (parsedEspecialidad.prioridad) {
        // console.log(
        //   "🔄 Sincronizando prioridad al montar:",
        //   parsedEspecialidad.prioridad
        // );
        setPrioridad(parsedEspecialidad.prioridad);
      } else {
        console.warn("⚠️ Prioridad no encontrada en localStorage.");
      }
    }
  }, [claveConsulta]);

  //* Guardar pase a especialidad
  const guardarPaseEspecialidad = async () => {
    try {
      //console.log("📤 Guardando pase a especialidad...");

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

      // console.log(
      //   "🔍 Datos preparados para el backend (pase a especialidad):",
      //   paseEspecialidadPayload
      // );

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

      //console.log("✅ Pase a especialidad guardado correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar pase a especialidad:", error);
      throw error;
    }
  };

  //* Actualizar clavestatus
  const actualizarClavestatus = async (nuevoEstatus) => {
    try {
      //console.log("📤 Actualizando clavestatus a:", nuevoEstatus);
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

      //console.log(`✅ Clavestatus actualizado exitosamente a ${nuevoEstatus}.`);
    } catch (error) {
      console.error("❌ Error al actualizar clavestatus:", error);
      throw error;
    }
  };

  //* Guardar incapacidad
  const guardarIncapacidad = async () => {
    try {
      //console.log("📤 Guardando incapacidad...");
      const cachedIncapacidad = localStorage.getItem("Incapacidad") || "{}";
      const { fechaInicio, fechaFin, diagnostico } =
        JSON.parse(cachedIncapacidad);

      const payload = {
        claveConsulta,
        clavenomina,
        fechaInicial: fechaInicio || null,
        fechaFinal: fechaFin || null,
        fechaInicial: normalizeDateForSQL(fechaInicio, true),
        fechaFinal: normalizeDateForSQL(fechaFin, false),
        diagnostico:
          diagnostico ||
          "Sin Observaciones, No Se Asignó Incapacidad En Esta Consulta",
        estatus: 1,
        clavepaciente,
      };

      //console.log("Payload preparado para guardar incapacidad:", payload);

      const response = await fetch("/api/incapacidades/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Error del backend al guardar incapacidad:", error);
        throw new Error(error.message || "Error al guardar incapacidad.");
      }

      //console.log("✅ Incapacidad guardada correctamente.");
    } catch (error) {
      console.error("❌ Error al guardar incapacidad:", error);
      throw error;
    }
  };

  //* Guardado global
  const handleGuardarGlobal = async () => {
    setLoading(true);
    //console.log("🔄 Guardando globalmente...");

    try {
      //* Mostrar alerta de confirmación si todas las respuestas son "NO"
      if (
        formulariosCompletos["Medicamentos"] === false &&
        formulariosCompletos["PaseEspecialidad"] === false &&
        formulariosCompletos["Incapacidades"] === false
      ) {
        const result = await showCustomAlert(
          "warning",
          "Confirmación requerida",
          `No se asignarán medicamentos, especialidad ni incapacidad en esta consulta.<br/><span style="color: #ffcc00; font-weight: bold;">¿Desea continuar?</span>`,
          "Aceptar",
          {
            showCancelButton: true,
            confirmButtonColor: "#1e90ff",
            cancelButtonColor: "#ff1744",
            cancelButtonText: "Cancelar",
            background: "linear-gradient(145deg, #333333, #222222)",
            customClass: {
              popup:
                "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,255,0,0.9)] rounded-lg",
            },
          }
        );

        if (!result.isConfirmed) {
          //console.log("🚫 Guardado cancelado por el usuario.");
          return;
        }
      }

      //console.log("📤 Iniciando guardado global...");

      //* Realizar cada operación de guardado de forma secuencial para detenerse en caso de error
      await guardarDatosAdicionales();
      await guardarMedicamentos();
      await guardarPaseEspecialidad();
      await guardarIncapacidad();

      //* Actualizar el clavestatus solo si todas las operaciones fueron exitosas
      await actualizarClavestatus(2);

      limpiarCacheLocalStorage();

      //* Limpiar completamente el localStorage después de guardar
      localStorage.clear();
      limpiarFormulario();

      //* Cifrar la claveConsulta con Base64
      const encryptedClaveConsulta = btoa(claveConsulta.toString());

      //* Navegar a la otra pantalla enviando la claveConsulta cifrada
      router.push(
        `/consultas/recetas/ver-recetas?claveconsulta=${encryptedClaveConsulta}`
      );

      //* Mostrar alerta de éxito con claveConsulta en grande
      await showCustomAlert(
        "success",
        "Consulta Guardada",
        `
    La consulta se ha guardado correctamente.<br/>
    <strong style="color: #00e676; font-size: 1.2em;">Clave Consulta: ${claveConsulta}</strong>
  `,
        "Aceptar"
      );
    } catch (error) {
      console.error("❌ Error durante el guardado global:", error);

      //! Mostrar alerta de error estilizada
      await showCustomAlert(
        "error",
        "Error en el guardado",
        `
    Hubo un problema al guardar los datos. Por favor, revisa los errores e intenta nuevamente.<br/>
    <strong style="color: #ff1744;">Error: ${
      error.message || "No especificado"
    }</strong>
  `,
        "Aceptar"
      );
    } finally {
      setLoading(false);
    }
  };

  const tooltipData = tooltipFaltante();

  return (
    <div className="flex space-x-4 mt-4">
      <div className="relative inline-block group">
        <button
          onClick={handleGuardarGlobal}
          disabled={!todosCompletos || loading}
          className={`relative px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 overflow-hidden ${
            todosCompletos && !loading
              ? "bg-green-600/90 hover:bg-green-700/90 focus:outline-none"
              : "bg-gray-600/90 cursor-not-allowed"
          }`}
        >
          {loading ? "Cargando..." : "Guardar Todo"}
        </button>

        <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 transition-all duration-300 ease-in-out transform group-hover:translate-y-0 translate-y-2">
          <div className="relative p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                <span className="text-lg">{tooltipMessage.icon}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {tooltipMessage.title}
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-300">
                {tooltipMessage.description}
              </p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 blur-xl opacity-50"></div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rotate-45 border-r border-b border-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccionesConsulta;
