/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useContext } from "react";
import Medicamentos from "./medicamentos";
import PaseEspecialidad from "./pase-especialidad";
import Incapacidades from "./incapacidades";
import HistorialConsultas from "./historial-consultas";
import EnfermedadesCronicas from "./enfermedades-cronicas";
import Antecedentes from "./antecedentes";
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
  console.log("Prop pasarEspecialidad en DatosAdicionales:", pasarEspecialidad);
  console.log("Prop claveConsulta en DatosAdicionales:", claveConsulta);
  const { formulariosCompletos, updateFormulario } =
    useContext(FormularioContext);
  const [diagnosticoTexto, setDiagnosticoTexto] = useState("");
  const [motivoConsultaTexto, setMotivoConsultaTexto] = useState("");

  //* Función para procesar el texto:
  //* - Convierte a mayúsculas.
  //* - Separa en líneas y divide cada línea en fragmentos de 145 caracteres.
  //* - Limita el total a máximo 7 líneas.
  const processText = (text) => {
    let upperText = text.toUpperCase();
    //* Separa por saltos de línea
    let lines = upperText.split("\n");
    let processedLines = [];
    for (let line of lines) {
      //* Divide en fragmentos de 145 caracteres si es muy larga la línea
      while (line.length > 145) {
        processedLines.push(line.slice(0, 145));
        line = line.slice(145);
      }
      processedLines.push(line);
    }
    //* Limitar a máximo 7 líneas
    if (processedLines.length > 7) {
      processedLines = processedLines.slice(0, 7);
    }
    return processedLines.join("\n");
  };

  //* Inicializar datos solo si están en `localStorage`
  useEffect(() => {
    const diagnostico = localStorage.getItem("diagnosticoTexto") || "";
    const motivoConsulta = localStorage.getItem("motivoConsultaTexto") || "";
    setDiagnosticoTexto(processText(diagnostico));
    setMotivoConsultaTexto(processText(motivoConsulta));
  }, [claveConsulta]);

  const limpiarFormulario = useCallback(() => {
    setDiagnosticoTexto("");
    setMotivoConsultaTexto("");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
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

  //* Se calcula dinámicamente el máximo permitido:
  //* Cada línea permite 145 caracteres, con un máximo de 7 líneas.
  const diagLines = diagnosticoTexto.split("\n").length;
  const diagMaxAllowed = diagLines < 7 ? diagLines * 145 : 7 * 145;
  const motivoLines = motivoConsultaTexto.split("\n").length;
  const motivoMaxAllowed = motivoLines < 7 ? motivoLines * 145 : 7 * 145;

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
          "Incapacidades",
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

      {subPantalla === "Incapacidades" && (
        <Incapacidades
          clavenomina={numeroDeNomina}
          nombrePaciente={nombrePaciente}
          clavepaciente={clavepaciente}
          claveConsulta={claveConsulta}
          nombreMedico={nombreMedico}
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
