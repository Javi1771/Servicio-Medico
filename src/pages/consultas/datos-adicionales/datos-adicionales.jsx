/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Medicamentos from "./medicamentos";
import PaseEspecialidad from "./pase-especialidad";
import Incapacidades from "./incapacidades";
import HistorialConsultas from "./historial-consultas";
import EnfermedadesCronicas from "./enfermedades-cronicas";
import Antecedentes from "./antecedentes";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

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
  clavepaciente,
  nombreMedico,
  claveEspecialidad,
}) => {
  console.log(
    "Valor inicial de clavepaciente recibido en DatosAdicionales:",
    clavepaciente
  );
  const [diagnosticoTexto, setDiagnosticoTexto] = useState("");
  const [motivoConsultaTexto, setMotivoConsultaTexto] = useState("");
  const [formularioCompleto, setFormularioCompleto] = useState(false);

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

  //* Función para guardar datos
  const handleGuardar = async () => {
    try {
      const response = await fetch(
        "/api/pacientes-consultas/diagnostico_observaciones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta,
            diagnostico: diagnosticoTexto,
            motivoconsulta: motivoConsultaTexto,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Error al guardar:", error);
        throw new Error("Error al guardar datos.");
      }

      //* Mostrar alerta de éxito
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Datos guardados correctamente</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>El diagnóstico y motivo de consulta han sido guardados exitosamente.</p>",
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
      console.error("Error en la solicitud de guardado:", error);

      //! Mostrar alerta de error
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar los datos. Por favor, inténtalo nuevamente.</p>",
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
            Motivo de Consulta
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí las observaciones..."
            value={motivoConsultaTexto}
            onChange={handleMotivoConsultaChange}
          />
          <br />
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Diagnóstico
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí el diagnóstico..."
            value={diagnosticoTexto}
            onChange={handleDiagnosticoChange}
          />
          <button
            className="mt-4 bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
            onClick={handleGuardar}
          >
            Guardar
          </button>
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
          setFormularioCompleto={setFormularioCompleto}
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

      {subPantalla === "Padecimientos Críticos" && (
        <EnfermedadesCronicas
          clavenomina={numeroDeNomina}
          nombrepaciente={nombrePaciente}
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
