import React, { useState, useEffect } from "react";

const HistorialMedicamentos = ({ clavenomina, clavepaciente }) => {
  const [historialMedicamentos, setHistorialMedicamentos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  //* Cargar historial desde el endpoint
  useEffect(() => {
    if (clavenomina && clavepaciente) {
      const url = `/api/medicamentos/historial?${new URLSearchParams({
        clavepaciente,
        clavenomina,
      }).toString()}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setHistorialMedicamentos(data.historial || []);
            setCurrentPage(1); //! Reinicia la paginación al cambiar datos
          } else {
            console.error("Error al cargar el historial:", data.error);
            setHistorialMedicamentos([]);
          }
        })
        .catch((err) => console.error("Error al cargar historial:", err));
    }
  }, [clavenomina, clavepaciente]);

  //* Guardar historial en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(
      "historialMedicamentos",
      JSON.stringify(historialMedicamentos)
    );
  }, [historialMedicamentos]);

  //* Cálculo de páginas
  const totalPages = Math.ceil(historialMedicamentos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = historialMedicamentos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-gray-900 p-8 rounded-xl shadow-2xl mt-10">
      <h3 className="text-3xl font-semibold text-center text-purple-400 mb-6">
        Historial de Medicamentos
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-lg text-left">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
              <th className="py-4 px-6 text-base font-semibold">Medicamento</th>
              <th className="py-4 px-6 text-base font-semibold">Indicaciones</th>
              <th className="py-4 px-6 text-base font-semibold">Tratamiento</th>
              <th className="py-4 px-6 text-base font-semibold">Piezas</th>
              <th className="py-4 px-6 text-base font-semibold">Proveedor</th>
              <th className="py-4 px-6 text-base font-semibold">Fecha Emisión</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.medicamento}
                  </td>
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.indicaciones}
                  </td>
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.tratamiento || ""}
                  </td>
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.piezas || ""}
                  </td>
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.nombreproveedor || ""}
                  </td>
                  <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                    {item.fechaEmision}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-6 text-center text-gray-400 border-t border-gray-800"
                >
                  No hay medicamentos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 text-purple-300">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-purple-700 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-purple-700 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialMedicamentos;
