/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import Pusher from "pusher-js";

const ConsultasAtendidas = () => {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Control de carga

  //* Ordenar pacientes por fecha de consulta
  const ordenarPacientes = (pacientes) =>
    pacientes.sort((a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta));

  //* Cargar datos iniciales
  const cargarAtendidas = async () => {
    if (isLoading) return; // Evitar llamadas simultáneas
    setIsLoading(true);

    try {
      const response = await fetch("/api/pacientes-consultas/consultasHoy?clavestatus=4");
      const data = await response.json();
      if (response.ok) {
        const consultasOrdenadas = ordenarPacientes(data.consultas || []);
        setPacientes((prevPacientes) => {
          // Solo actualizar si los datos son diferentes
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

  //* Manejo de eventos de Pusher
  const manejarEventoPusher = useCallback(
    (data) => {
      console.log("[INFO] Evento recibido de Pusher:", data);

      if (!data.claveConsulta || typeof data.clavestatus === "undefined") {
        console.error("[ERROR] Datos inválidos recibidos en el evento Pusher:", data);
        return;
      }

      setPacientes((prevPacientes) => {
        const pacienteIndex = prevPacientes.findIndex(
          (paciente) => paciente.claveconsulta === data.claveConsulta
        );

        if (data.clavestatus === 4) {
          // Agregar paciente si no existe
          if (pacienteIndex === -1) {
            const nuevosPacientes = ordenarPacientes([...prevPacientes, data]);
            console.log("[INFO] Paciente agregado:", nuevosPacientes);
            return nuevosPacientes;
          }
        } else {
          // Eliminar paciente si el estado ya no es "atendida"
          const nuevosPacientes = prevPacientes.filter(
            (paciente) => paciente.claveconsulta !== data.claveConsulta
          );
          console.log("[INFO] Paciente eliminado:", nuevosPacientes);
          return nuevosPacientes;
        }

        console.log("[INFO] Sin cambios en los pacientes atendidos.");
        return prevPacientes;
      });
    },
    [] // Sin dependencias para evitar re-creación
  );

  useEffect(() => {
    console.log("[INFO] Montando componente ConsultasAtendidas");
    cargarAtendidas(); // Cargar datos iniciales

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe("consultas");
    channel.bind("estatus-actualizado", manejarEventoPusher);

    // Cleanup al desmontar el componente
    return () => {
      console.log("[INFO] Desmontando componente ConsultasAtendidas");
      channel.unbind("estatus-actualizado", manejarEventoPusher);
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [manejarEventoPusher]);

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
