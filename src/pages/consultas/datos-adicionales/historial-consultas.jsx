/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";

const HistorialConsultas = () => {
  const [consultas, setConsultas] = useState([
    {
      fecha: "2024-10-21",
      presion: "120/80",
      peso: "70 kg",
      diagnostico: "Fiebre",
      observacion: "Recomendado descanso de 3 días",
    },
    {
      fecha: "2024-10-15",
      presion: "115/75",
      peso: "72 kg",
      diagnostico: "Dolor de cabeza",
      observacion: "Prescripción de Paracetamol",
    },
  ]);

  const [receta, setReceta] = useState({
    nombre: "Juan Pérez",
    edad: "30",
    presion: "120/80",
    peso: "70 kg",
    diagnostico: "Fiebre",
    observaciones: "Recomendado descanso de 3 días y Paracetamol",
    medicamentos: [
      {
        medicamento: "Paracetamol",
        indicaciones: "Cada 8 horas",
        tratamiento: "7 días",
      },
      {
        medicamento: "Ibuprofeno",
        indicaciones: "Cada 6 horas",
        tratamiento: "5 días",
      },
    ],
  });

  const [mostrarReceta, setMostrarReceta] = useState(false);

  const handleVerReceta = () => {
    setMostrarReceta(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-6">
        Historial de Consultas
      </h1>

      {/* Tabla de historial de consultas */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
          Consultas Realizadas
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-2 md:p-3">Fecha</th>
                <th className="p-2 md:p-3">Presión</th>
                <th className="p-2 md:p-3">Peso</th>
                <th className="p-2 md:p-3">Diagnóstico</th>
                <th className="p-2 md:p-3">Observación</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((consulta, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-600 transition-colors duration-300"
                >
                  <td className="py-2 md:py-3 px-2 md:px-4">{consulta.fecha}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{consulta.presion}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{consulta.peso}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {consulta.diagnostico}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {consulta.observacion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón para ver la receta */}
      <div className="mt-8 text-right">
        <button
          onClick={handleVerReceta}
          className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow hover:bg-blue-500 transition duration-200"
        >
          Ver Receta
        </button>
      </div>

      {/* Mostrar receta */}
      {mostrarReceta && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl md:text-3xl font-bold mb-4 text-center">
            Receta Médica
          </h2>
          <p>
            <strong>Nombre:</strong> {receta.nombre}
          </p>
          <p>
            <strong>Edad:</strong> {receta.edad} años
          </p>
          <p>
            <strong>Presión:</strong> {receta.presion}
          </p>
          <p>
            <strong>Peso:</strong> {receta.peso}
          </p>
          <p>
            <strong>Diagnóstico:</strong> {receta.diagnostico}
          </p>
          <p>
            <strong>Observaciones:</strong> {receta.observaciones}
          </p>

          <h3 className="text-lg md:text-2xl font-bold mt-6 mb-2">
            Medicamentos
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3">Medicamento</th>
                  <th className="p-2 md:p-3">Indicaciones</th>
                  <th className="p-2 md:p-3">Tratamiento</th>
                </tr>
              </thead>
              <tbody>
                {receta.medicamentos.map((medicamento, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-600 transition-colors duration-300"
                  >
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {medicamento.medicamento}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {medicamento.indicaciones}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      {medicamento.tratamiento}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialConsultas;
