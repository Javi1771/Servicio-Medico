/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const ConsultasAtendidas = () => {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  //* Ordenar pacientes por fecha de consulta (descendente)
  const ordenarPacientes = (pacientes) =>
    pacientes.sort((a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta));

  //* Cargar datos iniciales
  const cargarAtendidas = async () => {
    if (isLoading) return; //! Evitar llamadas simultáneas
    setIsLoading(true);

    try {
      const response = await fetch("/api/pacientes-consultas/consultasHoy?clavestatus=2");
      const data = await response.json();
      if (response.ok) {
        const consultasOrdenadas = ordenarPacientes(data.consultas || []);
        setPacientes((prevPacientes) => {
          //* Actualizar solo si hay cambios
          if (JSON.stringify(prevPacientes) !== JSON.stringify(consultasOrdenadas)) {
            console.log("[INFO] Actualizando consultas atendidas:", consultasOrdenadas);
            return consultasOrdenadas;
          }
          return prevPacientes;
        });
      } else {
        console.error("[ERROR] Al cargar consultas atendidas:", data.message);
      }
    } catch (error) {
      console.error("[ERROR] Al cargar consultas atendidas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //* Llamar a cargarAtendidas() al montar el componente
  useEffect(() => {
    console.log("[INFO] Montando componente ConsultasAtendidas");
    cargarAtendidas();
  }, []);

  //* Navegar a la página de recetas al hacer clic en una fila
  const handleRowClick = (claveConsulta) => {
    const encryptedClaveConsulta = btoa(claveConsulta.toString()); //* "Cifrar" la claveConsulta
    router.push(`/consultas/recetas/ver-recetas?claveconsulta=${encryptedClaveConsulta}`);
  };

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
          {pacientes.length > 0 ? (
            pacientes.map((paciente, index) => (
              <tr
                key={index}
                className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-green-500 to-green-700 transition duration-300 ease-in-out rounded-lg shadow-md cursor-pointer"
                onClick={() => handleRowClick(paciente.claveconsulta)}
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
                No hay consultas atendidas en este momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultasAtendidas;
