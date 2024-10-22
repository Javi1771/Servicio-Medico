// DatosAdicionales.js
import React from "react";
import Medicamentos from "./medicamentos";
import PaseEspecialidad from "./pase-especialidad";
import Incapacidades from "./incapacidades";

const DatosAdicionales = ({ subPantalla, handleSubPantallaChange }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="flex space-x-4 mb-8">
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
            className={`transition transform duration-300 hover:scale-105 mt-1 block w-full rounded-md text-white py-3 px-5 ${
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
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h3 className="text-3xl font-bold mb-6 text-white">Diagnóstico</h3>
          <textarea
            className="mt-3 block w-full h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí el diagnóstico..."
          />
          <br />
          <h3 className="text-2xl font-bold mb-4 text-white">Observaciones</h3>
          <textarea
            className="mt-3 block w-full h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
            placeholder="Escribe aquí las observaciones..."
          />
        </div>
      )}

      {/* Medicamentos */}
      {subPantalla === "Medicamentos" && <Medicamentos />}
      {subPantalla === "Pase a Especialidad" && <PaseEspecialidad />}
      {subPantalla === "Incapacidades" && <Incapacidades />}
    </div>
  );
};

export default DatosAdicionales;
