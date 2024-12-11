/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";

const HistorialConsultas = ({ clavepaciente, clavenomina }) => {
  const [consultas, setConsultas] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  console.log("Clavepaciente recibido en HistorialConsultas:", clavepaciente);
  console.log("Clavenomina recibido en HistorialConsultas:", clavenomina);

  const cargarHistorialConsultas = async () => {
    const params = new URLSearchParams();
    if (clavepaciente) params.append("clavepaciente", clavepaciente);
    if (clavenomina) params.append("clavenomina", clavenomina);

    const url = `/api/historial-consultas/historialConsultas?${params.toString()}`;
    console.log("URL que se está solicitando:", url);

    try {
      const response = await fetch(url);
      console.log("Respuesta del servidor (status):", response.status);

      const data = await response.json();
      console.log("Datos recibidos del servidor:", data);

      if (response.ok) {
        setConsultas(data);
        setHasFetched(true);
      } else {
        console.error("Error al cargar historial de consultas:", data.message);
      }
    } catch (error) {
      console.error(
        "Error inesperado al intentar cargar historial de consultas:",
        error
      );
    }
  };

  useEffect(() => {
    if (!hasFetched) {
      console.log("Disparando la carga de historial de consultas...");
      cargarHistorialConsultas();
    }
  }, [clavepaciente, clavenomina, hasFetched]);

  if (!clavepaciente && !clavenomina) {
    return (
      <div className="text-center text-gray-400">
        Esperando datos del paciente o nómina...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
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
            {consultas.length > 0 ? (
              consultas.map((consulta, index) => (
                <tr
                  key={index}
                  className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {consulta.fechaconsulta
                      ? new Date(consulta.fechaconsulta).toLocaleDateString(
                          "es-MX",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {consulta.motivoconsulta || "Sin motivo"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {consulta.diagnostico || "Sin diagnóstico"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {consulta.especialidadinterconsulta || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-400">
                  No hay consultas para el paciente seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialConsultas;
