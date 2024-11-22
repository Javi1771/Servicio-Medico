/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Medicamentos from "./medicamentos";
import PaseEspecialidad from "./pase-especialidad";
import Incapacidades from "./incapacidades";
import HistorialConsultas from "./historial-consultas";
import EnfermedadesCronicas from "./enfermedades-cronicas";
import Antecedentes from "./antecedentes";

const DatosAdicionales = ({
  subPantalla,
  handleSubPantallaChange,
  setDiagnostico,
  setMotivoConsulta,
  claveConsulta,
  pasarEspecialidad,
  setPasarEspecialidad,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  observaciones,
  setObservaciones,
  numeroDeNomina,
  nombrePaciente,
}) => {
  const [diagnosticoTexto, setDiagnosticoTexto] = useState("");
  const [motivoConsultaTexto, setMotivoConsultaTexto] = useState("");
  const [nombrePacienteSeleccionado, setNombrePacienteSeleccionado] =
    useState("");
  const [formularioCompleto, setFormularioCompleto] = useState(false); // Define el estado aquí

  const handleDiagnosticoChange = (e) => {
    const value = e.target.value;
    setDiagnosticoTexto(value);
    setDiagnostico(value); //* Actualiza en el componente principal
  };

  const handleMotivoConsultaChange = (e) => {
    const value = e.target.value;
    setMotivoConsultaTexto(value);
    setMotivoConsulta(value); //* Actualiza en el componente principal
  };

  const handlePacienteClick = (paciente) => {
    setPacienteSeleccionado(paciente);
    setNombrePacienteSeleccionado(paciente.nombrepaciente); //* Establece el nombre del paciente seleccionado
  };

  return (
    <div className="bg-gray-900 p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex flex-wrap md:flex-nowrap md:space-x-4 space-y-2 md:space-y-0 mb-4 md:mb-8">
        {[
          "Diagnóstico",
          "Medicamentos",
          "Pase a Especialidad",
          "Incapacidades",
          "Historial de Consultas",
          "Padecimientos Críticos",
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
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Diagnóstico
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí el diagnóstico..."
            value={diagnosticoTexto}
            onChange={handleDiagnosticoChange}
          />
          <br />
          <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-white">
            Motivo de Consulta y Observaciones
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí las observaciones..."
            value={motivoConsultaTexto}
            onChange={handleMotivoConsultaChange}
          />
        </div>
      )}

      {subPantalla === "Medicamentos" && <Medicamentos />}
      {subPantalla === "Pase a Especialidad" && (
        <PaseEspecialidad
          claveConsulta={claveConsulta}
          pasarEspecialidad={pasarEspecialidad}
          setPasarEspecialidad={setPasarEspecialidad}
          especialidadSeleccionada={especialidadSeleccionada}
          setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          setFormularioCompleto={setFormularioCompleto}
        />
      )}
      {subPantalla === "Incapacidades" && <Incapacidades />}
      {subPantalla === "Historial de Consultas" && (
        <HistorialConsultas
          numeroNomina={numeroDeNomina}
          nombrePaciente={nombrePaciente}
        />
      )}

      {subPantalla === "Padecimientos Críticos" && (
        <EnfermedadesCronicas
          clavenomina={numeroDeNomina}
          nombrePaciente={nombrePaciente}
        />
      )}
      {subPantalla === "Antecedentes" && (
        <Antecedentes
          clavenomina={numeroDeNomina}
          nombrePaciente={nombrePaciente}
        />
      )}
    </div>
  );
};

export default DatosAdicionales;
