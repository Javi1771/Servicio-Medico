/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useContext } from "react";
import Medicamentos from "../../consultas/datos-adicionales/medicamentos";
import PaseEspecialidad from "../../consultas/datos-adicionales/pase-especialidad";
import HistorialConsultas from "../../consultas/datos-adicionales/historial-consultas";
import EnfermedadesCronicas from "../../consultas/datos-adicionales/enfermedades-cronicas";
import Antecedentes from "../../consultas/datos-adicionales/antecedentes";
import { FormularioContext } from "/src/context/FormularioContext";

const DatosAdicionales = ({
  subPantalla,
  handleSubPantallaChange,
  claveConsulta,
  limpiarFormularioGlobal,
  numeroDeNomina,
  nombrePaciente,
  clavepaciente,
  nombreMedico,
  claveEspecialidad,
  pasarEspecialidad,
  setPasarEspecialidad,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  observaciones,
  setObservaciones,
}) => {
  // console.log("Prop pasarEspecialidad en DatosAdicionales:", pasarEspecialidad);
  // console.log("Prop claveConsulta en DatosAdicionales:", claveConsulta);
  const { formulariosCompletos, updateFormulario } =
    useContext(FormularioContext);

  const [diagnosticoTexto, setDiagnosticoTexto] = useState("");
  const [motivoConsultaTexto, setMotivoConsultaTexto] = useState("");
  const [alergiasTexto, setAlergiasTexto] = useState("");

  //* Función para procesar el texto:
  //* - Convierte a mayúsculas.
  //* - Separa en líneas y divide cada línea en fragmentos de 130 caracteres.
  //* - Limita el total a máximo 7 líneas.
  const processText = (text) => {
    let upperText = text.toUpperCase();
    //* Separa por saltos de línea
    let lines = upperText.split("\n");
    let processedLines = [];
    for (let line of lines) {
      //* Divide en fragmentos de 130 caracteres si es muy larga la línea
      while (line.length > 130) {
        processedLines.push(line.slice(0, 130));
        line = line.slice(130);
      }
      processedLines.push(line);
    }
    //* Limitar a máximo 7 líneas
    if (processedLines.length > 6) {
      processedLines = processedLines.slice(0, 6);
    }
    return processedLines.join("\n");
  };

  //* Inicializar datos solo si están en `localStorage`
  useEffect(() => {
    const diagnostico = localStorage.getItem("diagnosticoTexto") || "";
    const motivoConsulta = localStorage.getItem("motivoConsultaTexto") || "";
    const alergias = localStorage.getItem("alergiasTexto") || "";
    setDiagnosticoTexto(processText(diagnostico));
    setMotivoConsultaTexto(processText(motivoConsulta));
    setAlergiasTexto(alergias.toUpperCase().slice(0, 100));
  }, [claveConsulta]);

  const limpiarFormulario = useCallback(() => {
    setDiagnosticoTexto("");
    setMotivoConsultaTexto("");
    setAlergiasTexto("");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
    localStorage.removeItem("alergiasTexto");
    if (limpiarFormularioGlobal) limpiarFormularioGlobal();
  }, [limpiarFormularioGlobal]);

  //* Actualizar estado cuando cambien los textos, procesando el contenido
  const handleDiagnosticoChange = useCallback((e) => {
    const newValue = processText(e.target.value);
    setDiagnosticoTexto(newValue);
    localStorage.setItem("diagnosticoTexto", newValue);
  }, []);

  const handleMotivoConsultaChange = useCallback((e) => {
    const newValue = processText(e.target.value);
    setMotivoConsultaTexto(newValue);
    localStorage.setItem("motivoConsultaTexto", newValue);
  }, []);

  const handleAlergiasChange = useCallback((e) => {
    const raw = e.target.value.toUpperCase();
    const newValue = raw.slice(0, 100);
    setAlergiasTexto(newValue);
    localStorage.setItem("alergiasTexto", newValue);
  }, []);

  //* Se calcula dinámicamente el máximo permitido:
  //* Cada línea permite 130 caracteres, con un máximo de 7 líneas.
  const diagLines = diagnosticoTexto.split("\n").length;
  const diagMaxAllowed = diagLines < 6 ? diagLines * 130 : 6 * 130;
  const motivoLines = motivoConsultaTexto.split("\n").length;
  const motivoMaxAllowed = motivoLines < 6 ? motivoLines * 130 : 6 * 130;

  useEffect(() => {
    const esCompleto =
      diagnosticoTexto.trim().length > 0 &&
      motivoConsultaTexto.trim().length > 0;
    if (formulariosCompletos["DatosAdicionales"] !== esCompleto) {
      updateFormulario("DatosAdicionales", esCompleto);
    }
  }, [
    diagnosticoTexto,
    motivoConsultaTexto,
    formulariosCompletos,
    updateFormulario,
  ]);

  return (
    <div className="bg-gray-900 p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex flex-wrap md:flex-nowrap md:space-x-4 space-y-2 md:space-y-0 mb-4 md:mb-8">
        {[
          "Diagnóstico",
          "Medicamentos",
          "Pase a Especialidad",
        //   "Incapacidades",
          "Historial de Consultas",
          "Padecimientos Cronicos",
          "Antecedentes",
        ].map((pantalla, index) => (
          <button
            key={index}
            onClick={() => handleSubPantallaChange(pantalla)}
            className={`transition transform duration-300 hover:scale-105 block w-full md:w-auto rounded-md text-white py-2 md:py-3 px-4 md:px-5 text-sm md:text-base ${
              subPantalla === pantalla
                ? "bg-blue-800 font-bold shadow-md"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-md"
            }`}
          >
            {pantalla}
          </button>
        ))}
      </div>

      {subPantalla === "Diagnóstico" && (
        <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
          {/* Diagnóstico */}
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Diagnóstico
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="ESCRIBE AQUÍ EL DIAGNÓSTICO..."
            value={diagnosticoTexto}
            onChange={(e) =>
              diagnosticoTexto.length <= diagMaxAllowed
                ? handleDiagnosticoChange(e)
                : null
            }
          />
          <p
            className={`text-sm mt-1 text-right ${
              diagnosticoTexto.length >= diagMaxAllowed
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {diagnosticoTexto.length}/{diagMaxAllowed}
          </p>

          {/* Observaciones */}
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Observaciones
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="ESCRIBE AQUÍ LAS OBSERVACIONES..."
            value={motivoConsultaTexto}
            onChange={(e) =>
              motivoConsultaTexto.length <= motivoMaxAllowed
                ? handleMotivoConsultaChange(e)
                : null
            }
          />
          <p
            className={`text-sm mt-1 text-right ${
              motivoConsultaTexto.length >= motivoMaxAllowed
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {motivoConsultaTexto.length}/{motivoMaxAllowed}
          </p>

          {/* Alergias */}
          <h3 className="text-2xl md:text-3xl font-bold mt-6 mb-4 text-white">
            Alergias - Opcional
          </h3>
          <input
            type="text"
            className="
              mt-2 md:mt-3
              block w-full
              rounded-2xl
              bg-gray-800
              border-2 border-gray-600
              placeholder-gray-400
              text-white
              p-3
              shadow-inner
              focus:outline-none
              focus:border-blue-400
              focus:ring-2 focus:ring-blue-500/50
              transition duration-200 ease-in-out
            "
            placeholder="ESCRIBE AQUÍ LAS ALERGIAS (máx. 100 caracteres)"
            value={alergiasTexto}
            onChange={handleAlergiasChange}
            maxLength={100}
          />
          <p
            className={`text-sm mt-1 text-right ${
              alergiasTexto.length >= 100 ? "text-red-400" : "text-gray-400"
            }`}
          >
            {alergiasTexto.length}/100
          </p>

          <br />
        </div>
      )}

      {subPantalla === "Medicamentos" && (
        <Medicamentos
          clavenomina={numeroDeNomina}
          nombrePaciente={nombrePaciente}
          claveConsulta={claveConsulta}
          nombreMedico={nombreMedico}
          clavepaciente={clavepaciente}
          claveEspecialidad={claveEspecialidad}
        />
      )}

      {subPantalla === "Pase a Especialidad" && (
        <PaseEspecialidad
          claveConsulta={claveConsulta}
          pasarEspecialidad={pasarEspecialidad}
          setPasarEspecialidad={setPasarEspecialidad}
          especialidadSeleccionada={especialidadSeleccionada}
          setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          nombreMedico={nombreMedico}
          nombrePaciente={nombrePaciente}
          clavenomina={numeroDeNomina}
          clavepaciente={clavepaciente}
        />
      )}

      {subPantalla === "Historial de Consultas" && (
        <HistorialConsultas
          clavenomina={numeroDeNomina}
          clavepaciente={clavepaciente}
          nombrePaciente={nombrePaciente}
          claveConsulta={claveConsulta}
        />
      )}

      {subPantalla === "Padecimientos Cronicos" && (
        <EnfermedadesCronicas
          clavenomina={numeroDeNomina}
          clavepaciente={clavepaciente}
        />
      )}

      {subPantalla === "Antecedentes" && (
        <Antecedentes
          clavenomina={numeroDeNomina}
          clavepaciente={clavepaciente}
          nombrePaciente={nombrePaciente}
        />
      )}
    </div>
  );
};

export default DatosAdicionales;
