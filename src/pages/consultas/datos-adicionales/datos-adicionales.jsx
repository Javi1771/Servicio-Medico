// DatosAdicionales.js
import React from "react";
import Medicamentos from "./medicamentos";
import PaseEspecialidad from "./pase-especialidad";
import Incapacidades from "./incapacidades";
import HistorialConsultas from "./historial-consultas";
import EnfermedadesCronicas from "./enfermedades-cronicas";
import Antecedentes from "./antecedentes";

const DatosAdicionales = ({ subPantalla, handleSubPantallaChange }) => {
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

      {/* Diagnóstico */}
      {subPantalla === "Diagnóstico" && (
        <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
            Diagnóstico
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí el diagnóstico..."
          />
          <br />
          <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-white">
            Observaciones
          </h3>
          <textarea
            className="mt-2 md:mt-3 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí las observaciones..."
          />
        </div>
      )}

      {/* Otras pantallas */}
      {subPantalla === "Medicamentos" && <Medicamentos />}
      {subPantalla === "Pase a Especialidad" && <PaseEspecialidad />}
      {subPantalla === "Incapacidades" && <Incapacidades />}
      {subPantalla === "Historial de Consultas" && <HistorialConsultas />}
      {subPantalla === "Padecimientos Críticos" && <EnfermedadesCronicas />}
      {subPantalla === "Antecedentes" && <Antecedentes />}
    </div>
  );
};

export default DatosAdicionales;
