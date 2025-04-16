/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const ConsultasAtendidas = () => {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pacientesPorPagina = 5;

  const router = useRouter();

  //* Ordenar pacientes por fecha de consulta (descendente)
  const ordenarPacientes = (pacientes) =>
    pacientes.sort(
      (a, b) => new Date(b.fechaconsulta) - new Date(a.fechaconsulta)
    );

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
          if (JSON.stringify(prevPacientes) !== JSON.stringify(consultasOrdenadas)) {
            //console.log("[INFO] Actualizando consultas atendidas:", consultasOrdenadas);
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

  useEffect(() => {
    //console.log("[INFO] Montando componente ConsultasAtendidas");
    cargarAtendidas();
  }, []);

  //* Navegar a la página de recetas al hacer clic en una fila
  const handleRowClick = (claveConsulta) => {
    const encryptedClaveConsulta = btoa(claveConsulta.toString()); //* "Cifrar" la claveConsulta
    router.push(`/consultas/recetas/ver-recetas?claveconsulta=${encryptedClaveConsulta}`);
  };

  //* Manejar el cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); //! Reiniciar a la página 1 al filtrar
  };

  //* Filtrar pacientes por nombre (ignorando mayúsculas/minúsculas)
  const pacientesFiltrados = pacientes.filter((paciente) =>
    paciente.nombrepaciente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //* Paginación
  const indexUltimoPaciente = currentPage * pacientesPorPagina;
  const indexPrimerPaciente = indexUltimoPaciente - pacientesPorPagina;
  const pacientesActuales = pacientesFiltrados.slice(indexPrimerPaciente, indexUltimoPaciente);
  const totalPaginas = Math.ceil(pacientesFiltrados.length / pacientesPorPagina);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPaginas));
  };

  return (
    <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 tracking-wide">
        Consultas Atendidas
      </h1>

      {/* Buscador con más detalles e iconos */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          {/* Ícono de búsqueda a la izquierda */}
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-6 w-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar paciente..."
            className="block w-full pl-10 pr-10 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-md transition duration-300 ease-in-out bg-white text-gray-900"
          />
          {/* Botón para limpiar el input */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <svg
                className="h-5 w-5 text-gray-500 hover:text-red-500 transition-colors duration-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de consultas */}
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
          {isLoading ? (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-400">
                Cargando...
              </td>
            </tr>
          ) : pacientesActuales.length > 0 ? (
            pacientesActuales.map((paciente, index) => (
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

      {/* Controles de Paginación */}
      <div className="mt-6 flex justify-center items-center space-x-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-gray-300 font-medium">
          Página {currentPage} de {totalPaginas || 1}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPaginas || totalPaginas === 0}
          className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-300 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ConsultasAtendidas;
