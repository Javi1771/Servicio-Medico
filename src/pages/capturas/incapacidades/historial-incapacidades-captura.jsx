import React, { useState } from "react";

const HistorialIncapacidadesTable = ({ historial, loading }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;

  if (loading) {
    return (
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mt-8 flex justify-center items-center min-h-[200px]">
        <svg className="animate-spin h-12 w-12 text-white" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );
  }

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
    <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mt-8">
      <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
        Historial de Incapacidades
      </h2>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full rounded-lg text-left">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Folio Consulta
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Observaciones
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Fecha de Registro o Captura
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                ¿Quién Capturó o Registró la Incapacidad?
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Fecha Inicio Incapacidad
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Fecha Fin Incapacidad
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Médico Que Asignó Incapacidad
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Especialidad Del Médico
              </th>
            </tr>
          </thead>

          <tbody>
            {historial && historial.length > 0 ? (
              historialPaginado.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.claveconsulta || "Sin clave"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.observaciones || "Sin observaciones"}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.fecha}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.quiencapturo_nombre}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.fechainicio}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.fechafin}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.clavemedico_nombre}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.especialidad_clavemedico}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  No hay incapacidades registradas para el paciente.
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

export default HistorialIncapacidadesTable;
