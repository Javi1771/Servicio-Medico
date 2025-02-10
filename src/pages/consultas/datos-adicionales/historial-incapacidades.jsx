import React from "react";

const HistorialIncapacidadesTable = ({ historial }) => {
  return (
    <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mt-8">
      <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-center text-purple-400">
        Historial de Incapacidades
      </h2>

      <div className="overflow-x-auto">
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
                Fecha Inicio Incapacidad
              </th>
              <th className="p-3 md:p-4 text-sm md:text-base font-semibold text-left">
                Fecha Fin Incapacidad
              </th>
            </tr>
          </thead>

          <tbody>
            {historial && historial.length > 0 ? (
              historial.map((item, idx) => (
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
                    {item.fechainicio}
                  </td>
                  <td className="py-3 px-4 border-t border-gray-800 text-gray-300">
                    {item.fechafin}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No hay incapacidades registradas para el paciente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialIncapacidadesTable;
