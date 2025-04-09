/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';

const TratamientoInput = ({ med, index, handleMedicamentoChange, phraseTemplates }) => {
  //* Valor inicial obtenido desde el objeto o valor por defecto a 30 días
  const initialDays = med.tratamientoDias || 30;
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [message, setMessage] = useState(med.tratamiento || "");

  //! Si no existe un tratamiento definido, se genera uno aleatorio al montar el componente
  useEffect(() => {
    if (!med.tratamiento) {
      const randomIndex = Math.floor(Math.random() * phraseTemplates.length);
      const formattedMessage = phraseTemplates[randomIndex].replace("__", selectedDays);
      setMessage(formattedMessage);
      handleMedicamentoChange(index, "tratamiento", formattedMessage.toUpperCase());
      handleMedicamentoChange(index, "tratamientoDias", selectedDays);
    }
  }, []);

  //* Función para actualizar el tratamiento en función de los días seleccionados
  const updateTreatment = (days) => {
    setSelectedDays(days);
    const randomIndex = Math.floor(Math.random() * phraseTemplates.length);
    const formattedMessage = phraseTemplates[randomIndex].replace("__", days);
    setMessage(formattedMessage);
    handleMedicamentoChange(index, "tratamiento", formattedMessage.toUpperCase());
    handleMedicamentoChange(index, "tratamientoDias", days);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg mb-6">
      {/* Título similar al de indicaciones */}
      <label className="text-lg font-semibold text-gray-200 uppercase">TRATAMIENTO:</label>
      <p className="mt-2 text-gray-300">¿Por cuántos días?</p>
      <div className="mt-4 flex flex-col space-y-4">
        {/* Slider personalizado */}
        <input
          type="range"
          value={selectedDays}
          onChange={(e) => {
            const days = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
            updateTreatment(days);
          }}
          min="1"
          max="30"
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-400
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
            [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md"
        />
        {/* Input numérico con estilos de color y foco */}
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={selectedDays}
            onChange={(e) => {
              const days = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
              updateTreatment(days);
            }}
            min="1"
            max="30"
            className="w-20 p-2 rounded-md bg-gray-700 border border-gray-600 text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-gray-200 uppercase font-semibold">días</span>
        </div>
      </div>
      {/* Mensaje informativo final */}
      <p className="mt-4 text-sm text-gray-400 uppercase">
        {selectedDays} DÍAS - {message}
      </p>
    </div>
  );
};

export default TratamientoInput;
