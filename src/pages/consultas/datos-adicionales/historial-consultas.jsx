/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";

const HistorialConsultas = ({ numeroNomina, nombrePaciente }) => {
  const [consultas, setConsultas] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  const cargarHistorialConsultas = async () => {
    try {
      const response = await fetch(
        `/api/historialConsultas?num_nom=${numeroNomina}`
      );
      const data = await response.json();
      if (response.ok) {
        setConsultas(data);
        setHasFetched(true);
      } else {
        console.error("Error al cargar historial de consultas:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar historial de consultas:", error);
    }
  };

  useEffect(() => {
    if (numeroNomina && !hasFetched) {
      cargarHistorialConsultas();
    }
  }, [numeroNomina, hasFetched]);

  //? Filtra las consultas por el nombre del paciente
  const consultasFiltradas = consultas.filter(
    (consulta) =>
      consulta.nombrepaciente.toLowerCase() === nombrePaciente.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-5xl font-extrabold mb-6 md:mb-8 text-center text-indigo-400">
        Historial de Consultas
      </h1>

      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
          Consultas Realizadas
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Fecha de Consulta
                </th>
                {/* <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Nombre del Paciente
                </th> */}
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Motivo de Consulta
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Diagnóstico
                </th>
                <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                  Especialidad
                </th>
              </tr>
            </thead>
            <tbody>
              {consultasFiltradas.length > 0 ? (
                consultasFiltradas.map((consulta, index) => (
                  <tr
                    key={index}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {consulta.fechaconsulta}
                    </td>
                    {/* <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {consulta.nombrepaciente}
                    </td> */}
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {consulta.motivoconsulta}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {consulta.diagnostico}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                      {consulta.especialidadinterconsulta || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">
                    No hay consultas para el paciente seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistorialConsultas;
