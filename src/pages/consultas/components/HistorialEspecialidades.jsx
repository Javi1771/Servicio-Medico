import React, { useState } from "react";

const TablaHistorialEspecialidades = ({ historial, isLoading }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;

  const totalPaginas = Math.ceil(historial.length / elementosPorPagina);

  const historialPaginado = historial.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
      <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
        Historial de Especialidades
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-lg text-left">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Especialidad Asignada
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Prioridad
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Observaciones
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Fecha de Asignación
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  Cargando historial...
                </td>
              </tr>
            ) : historial.length > 0 ? (
              historialPaginado.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.especialidad || "N/A"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.prioridad}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.observaciones}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.fecha_asignacion}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  No hay especialidades registradas para el paciente
                  seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {historial.length > elementosPorPagina && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            Anterior
          </button>
          <span className="text-white text-lg">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default TablaHistorialEspecialidades;
