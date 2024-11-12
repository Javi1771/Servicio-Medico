import React, { useEffect, useState } from "react";

const AtendiendoActualmente = () => {
  const [pacientes, setPacientes] = useState([]);

  const cargarNuevasConsultas = async () => {
    try {
      const response = await fetch("/api/consultasHoy?clavestatus=2");
      const data = await response.json();
      if (response.ok) {
        const consultasOrdenadas = data.consultas.sort(
          (a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta)
        );
        setPacientes(consultasOrdenadas);
      } else {
        console.error("Error al cargar nuevas consultas:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar nuevas consultas:", error);
    }
  };

  useEffect(() => {
    cargarNuevasConsultas();

    const interval = setInterval(() => {
      cargarNuevasConsultas();
    }, 2000); // Actualiza cada 5 segundos

    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
  }, []);

  return (
    <div className="w-full overflow-x-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-500 tracking-wider">
        Pacientes Que Están Siendo Atendidos
      </h1>
      <table className="min-w-full text-gray-200 border-separate border-spacing-y-3">
        <thead>
          <tr className="bg-gray-800 bg-opacity-80 text-sm uppercase tracking-wide font-semibold">
            <th className="py-4 px-6 rounded-l-lg">Número de Nómina</th>
            <th className="py-4 px-6">Paciente</th>
            <th className="py-4 px-6">Edad</th>
            <th className="py-4 px-6 rounded-r-lg">Secretaría</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.length > 0 ? (
            pacientes.map((paciente, index) => (
              <tr
                key={index}
                className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-blue-600 to-purple-600 transition duration-300 ease-in-out rounded-lg shadow-md"
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
                No hay pacientes siendo atendidos en este momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AtendiendoActualmente;
