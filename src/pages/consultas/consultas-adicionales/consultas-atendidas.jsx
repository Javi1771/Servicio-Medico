import React, { useEffect, useState } from "react";

const ConsultasAtendidas = () => {
  const [pacientes, setPacientes] = useState([]);

  const cargarAtendidas = async () => {
    try {
      const response = await fetch("/api/consultasHoy?clavestatus=4");
      const data = await response.json();
      if (response.ok) {
        const consultasOrdenadas = data.consultas.sort(
          (a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta)
        );
        setPacientes(consultasOrdenadas);
      } else {
        console.error("Error al cargar consultas atendidas:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar consultas atendidas:", error);
    }
  };

  useEffect(() => {
    cargarAtendidas(); // Cargar datos inicialmente
    const interval = setInterval(cargarAtendidas, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []);

  return (
    <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 tracking-wide">
        Consultas Atendidas
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
          {pacientes.map((paciente, index) => (
            <tr
              key={index}
              className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-green-500 to-green-700 transition duration-300 ease-in-out rounded-lg shadow-md"
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultasAtendidas;
