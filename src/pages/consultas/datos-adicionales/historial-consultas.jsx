/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const HistorialConsultas = ({ clavepaciente, clavenomina }) => {
  const router = useRouter();
  const [consultas, setConsultas] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // ** Estados para paginación **
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(consultas.length / itemsPerPage);

  const cargarHistorialConsultas = async () => {
    const params = new URLSearchParams();
    if (clavepaciente) params.append("clavepaciente", clavepaciente);
    if (clavenomina) params.append("clavenomina", clavenomina);

    const url = `/api/historial-consultas/historialConsultas?${params.toString()}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setConsultas(data);
        setHasFetched(true);
        setCurrentPage(1); //! reinicia página al traer datos
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
      cargarHistorialConsultas();
    }
  }, [clavepaciente, clavenomina, hasFetched]);

  const handleRowClick = (consulta) => {
    if (!consulta.claveconsulta) {
      console.error("La consulta no tiene 'claveconsulta' definida:", consulta);
      return;
    }
    const encryptedClaveConsulta = btoa(consulta.claveconsulta.toString());
    router.push(
      `/consultas/recetas/ver-recetas?claveconsulta=${encryptedClaveConsulta}`
    );
  };

  if (!clavepaciente && !clavenomina) {
    return (
      <div className="text-center text-gray-400">
        Esperando datos del paciente o nómina...
      </div>
    );
  }

  // ** Subconjunto a mostrar en la página actual **
  const paginatedConsultas = consultas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
      <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
        Consultas Realizadas
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-lg text-left">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold">
                Fecha de Consulta
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold">
                Motivo de Consulta
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold">
                Diagnóstico
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold">
                Especialidad
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedConsultas.length > 0 ? (
              paginatedConsultas.map((consulta, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300 cursor-pointer"
                  onClick={() => handleRowClick(consulta)}
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

      {/* Controles de paginación */}
      {consultas.length > itemsPerPage && (
        <div className="flex justify-center space-x-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default HistorialConsultas;
