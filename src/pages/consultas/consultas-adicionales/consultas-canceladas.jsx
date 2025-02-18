/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";

const ConsultasCanceladas = () => {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pacientesMap, setPacientesMap] = useState(new Map());

  //* Ordenar pacientes por fecha de consulta (descendente)
  const ordenarPacientes = (pacientes) =>
    pacientes.sort((a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta));

  //* Actualiza el estado de pacientes garantizando la unicidad a través de un Map
  const actualizarPacientes = (nuevosPacientes) => {
    setPacientesMap((prevMap) => {
      const nuevoMapa = new Map(prevMap);
      nuevosPacientes.forEach((paciente) => {
        nuevoMapa.set(paciente.claveconsulta, paciente);
      });
      setPacientes(ordenarPacientes([...nuevoMapa.values()]));
      return nuevoMapa;
    });
  };

  //* Cargar datos iniciales
  const cargarCanceladas = async () => {
    if (isLoading) return; //! Evitar llamadas simultáneas
    setIsLoading(true);

    try {
      const response = await fetch("/api/pacientes-consultas/consultasHoy?clavestatus=0");
      const data = await response.json();
      if (response.ok) {
        actualizarPacientes(data.consultas || []);
        console.log("[INFO] Consultas canceladas cargadas:", data.consultas || []);
      } else {
        console.error("[ERROR] Al cargar consultas canceladas:", data.message);
      }
    } catch (error) {
      console.error("[ERROR] Al cargar consultas canceladas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //* Llamar a cargarCanceladas() una vez al montar el componente
  useEffect(() => {
    console.log("[INFO] Montando componente ConsultasCanceladas");
    cargarCanceladas();
  }, []);

  return (
    <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-red-500 tracking-wide">
        Consultas Canceladas
      </h1>
      <table className="min-w-full text-gray-300 border-separate border-spacing-y-3">
        <thead>
          <tr className="bg-gray-800 bg-opacity-80 text-sm uppercase tracking-wider font-semibold">
            <th className="py-4 px-6 rounded-l-lg">Número de Nómina</th>
            <th className="py-4 px-6">Paciente</th>
            <th className="py-4 px-6">Edad</th>
            <th className="py-4 px-6 rounded-r-lg">Secretaría</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.length > 0 ? (
            pacientes.map((paciente) => (
              <tr
                key={paciente.claveconsulta}
                className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-red-500 to-red-700 transition duration-300 ease-in-out rounded-lg shadow-md"
              >
                <td className="py-4 px-6 font-medium text-center">
                  {paciente.clavenomina || "N/A"}
                </td>
                <td className="py-4 px-6 text-center">
                  {paciente.nombrepaciente || "No disponible"}
                </td>
                <td className="py-4 px-6 text-center">
                  {paciente.edad || "Desconocida"}
                </td>
                <td className="py-4 px-6 text-center">
                  {paciente.departamento || "No asignado"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-400">
                No hay consultas canceladas en este momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultasCanceladas;
