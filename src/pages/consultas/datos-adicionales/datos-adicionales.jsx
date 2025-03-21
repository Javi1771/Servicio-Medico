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

  //* Inicializar datos solo si están en `localStorage` (para evitar valores persistentes no deseados)
  useEffect(() => {
    const diagnostico = localStorage.getItem("diagnosticoTexto") || "";
    const motivoConsulta = localStorage.getItem("motivoConsultaTexto") || "";
    setDiagnosticoTexto(diagnostico);
    setMotivoConsultaTexto(motivoConsulta);
  }, [claveConsulta]);

  const limpiarFormulario = useCallback(() => {
    setDiagnosticoTexto("");
    setMotivoConsultaTexto("");
    localStorage.removeItem("diagnosticoTexto");
    localStorage.removeItem("motivoConsultaTexto");
    if (limpiarFormularioGlobal) limpiarFormularioGlobal();
  }, [limpiarFormularioGlobal]);

  //* Actualizar estado cuando cambien los textos
  const handleDiagnosticoChange = useCallback((e) => {
    const value = e.target.value;
    setDiagnosticoTexto(value);
    localStorage.setItem("diagnosticoTexto", value);
  }, []);

  const handleMotivoConsultaChange = useCallback((e) => {
    const value = e.target.value;
    setMotivoConsultaTexto(value);
    localStorage.setItem("motivoConsultaTexto", value);
  }, []);

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
            placeholder="Escribe aquí el diagnóstico..."
            value={diagnosticoTexto}
            onChange={(e) =>
              e.target.value.length <= 380 ? handleDiagnosticoChange(e) : null
            }
          />
          <p
            className={`text-sm mt-1 text-right ${
              diagnosticoTexto.length >= 380 ? "text-red-400" : "text-gray-400"
            }`}
          >
            {diagnosticoTexto.length}/380
          </p>

          {/* Motivo de Consulta */}
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Observaciones
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí las observaciones..."
            value={motivoConsultaTexto}
            onChange={(e) =>
              e.target.value.length <= 345
                ? handleMotivoConsultaChange(e)
                : null
            }
          />
          <p
            className={`text-sm mt-1 text-right ${
              motivoConsultaTexto.length >= 345
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {motivoConsultaTexto.length}/345
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
