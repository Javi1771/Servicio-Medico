// HistorialTable.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const HistorialTable = () => {
  const [historial, setHistorial] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //* Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  //* Cálculo de páginas totales
  const totalPages = Math.ceil(historial.length / itemsPerPage);

  //* Determinación de los ítems a mostrar en la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const historialPaginado = historial.slice(startIndex, endIndex);

  //* Funciones de paginación
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  //* Para navegar entre rutas
  const router = useRouter();

  //* Encriptar y navegar con claveconsulta
  const handleRowClick = (claveconsulta) => {
    const encryptedConsulta = btoa(claveconsulta.toString());
    router.push(
      `/capturas/recetas/ver-recetas-pases?claveconsulta=${encryptedConsulta}`
    );
  };

  //* Carga de datos inicial desde el endpoint
  useEffect(() => {
    fetch("/api/especialidades/historialPasesNuevos")
      .then((res) => res.json())
      .then((data) => {
        //* Si el endpoint ya devuelve la fecha como string, sólo la asignamos
        const historialFormateado =
          data.historial?.map((item) => ({
            ...item,
            fechacita: item.fechacita,
          })) || [];

        setHistorial(historialFormateado);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error al obtener historial:", error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl w-full bg-gray-900 bg-opacity-90 rounded-3xl shadow-2xl p-12 border border-teal-500 border-opacity-40 my-8">
      <h2 className="text-3xl font-bold text-teal-300 mb-6 text-center tracking-wider">
        Historial de Pases Nuevos
      </h2>
      {isLoading ? (
        <p className="text-center text-white">Cargando historial...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-300 border-separate border-spacing-y-3">
              <thead>
                <tr className="bg-gray-800 bg-opacity-80 text-sm uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Nómina</th>
                  <th className="py-3 px-4">Nombre Paciente</th>
                  <th className="py-3 px-4">Fecha Cita</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Especialidad</th>
                </tr>
              </thead>
              <tbody>
                {historialPaginado.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-400">
                      No hay historial disponible.
                    </td>
                  </tr>
                ) : (
                  historialPaginado.map((item) => (
                    <tr
                      key={item.claveconsulta}
                      onClick={() => handleRowClick(item.claveconsulta)}
                      className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-teal-500 to-blue-700 transition duration-300 ease-in-out rounded-lg shadow-md cursor-pointer"
                    >
                      <td className="py-3 px-4">{item.clavenomina}</td>
                      <td className="py-3 px-4">{item.nombrepaciente}</td>
                      <td className="py-3 px-4">{item.fechacita}</td>
                      <td className="py-3 px-4">{item.departamento}</td>
                      <td className="py-3 px-4">{item.especialidad}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          {historial.length > 5 && (
            <div className="flex items-center justify-center mt-6 space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="bg-teal-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-white">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="bg-teal-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistorialTable;
