import React, { useState, useEffect } from "react";

// Función para obtener una cookie por su nombre
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const MedicamentosTable = ({ medicamentos = [], onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mostrar 10 elementos por página

  // Obtener el rol desde la cookie al montar el componente
  useEffect(() => {
    const rolCookie = getCookie("rol");
    setRole(rolCookie);
  }, []);

  // Mapeo de clasificación: letra -> nombre completo
  const classificationMapping = {
    p: "PATENTE",
    g: "GENERICO",
    c: "CONTROLADO",
    e: "ESPECIALIDAD",
  };

  // Función para determinar el estado de las piezas
  const getStockStatus = (piezas) => {
    if (piezas <= 10) return { label: "Bajo", color: "bg-red-600" };
    if (piezas >= 11 && piezas <= 39) return { label: "Medio", color: "bg-yellow-500" };
    return { label: "Alto", color: "bg-green-500" };
  };

  // Filtrar por medicamento o clasificación
  const filteredMedicamentos = medicamentos.filter((med) =>
    [med.medicamento, med.clasificación, String(med.ean), String(med.piezas)]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredMedicamentos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const medicamentosPaginados = filteredMedicamentos.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-black rounded-3xl shadow-[0_0_20px_#0ff] border border-teal-500">
      <h2 
        className="text-5xl font-extrabold text-teal-400 mb-8 text-center tracking-wider"
        style={{ textShadow: "0 0 15px #0ff" }}
      >
        📋 Medicamentos Registrados
      </h2>

      {/* Campo de búsqueda */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="🔍 Buscar Medicamento, Clasificación, EAN..."
          className="w-2/3 p-4 rounded-full bg-gray-800 text-teal-200 border border-teal-500 focus:ring-4 focus:ring-teal-400 transition duration-300 shadow-[0_0_10px_#0ff] outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de medicamentos */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-teal-200 rounded-xl shadow-xl border border-teal-500">
          <thead className="bg-gradient-to-r from-teal-400 to-teal-600 text-gray-900 uppercase tracking-wider text-sm">
            <tr>
              {["ID", "Medicamento", "Clasificación", "Presentación", "EAN", "Piezas", "Estado", "Acciones"].map((header) => (
                <th key={header} className="py-3 px-5 text-center">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicamentosPaginados.length > 0 ? (
              medicamentosPaginados.map((med) => {
                const stockStatus = getStockStatus(med.piezas);
                return (
                  <tr
                    key={med.id}
                    className="border-b border-gray-700 hover:scale-105 transition-transform duration-300"
                  >
                    <td className="py-3 px-5 text-center">{med.id}</td>
                    <td className="py-3 px-5 text-center">{med.medicamento}</td>
                    <td className="py-3 px-5 text-center">
                      {classificationMapping[med.clasificación?.toLowerCase()] || med.clasificación}
                    </td>
                    <td className="py-3 px-5 text-center">{`c/${med.presentación}`}</td>
                    <td className="py-3 px-5 text-center">{med.ean}</td>
                    <td className="py-3 px-5 text-center">{`(${med.piezas}) en stock`}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-white ${stockStatus.color} shadow-[0_0_10px_#0ff]`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="py-3 px-5 flex justify-center space-x-3">
                      <button
                        onClick={() => onEdit?.(med)}
                        className="bg-teal-500 text-gray-900 px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-yellow-400 transition duration-300"
                      >
                        ✏️ Editar
                      </button>
                      {/* Mostrar botón eliminar solo si el rol NO es "9" */}
                      {String(role) !== "9" && (
                        <button
                          onClick={() => onDelete?.(med.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-red-500 transition duration-300"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-400">
                  ❌ No hay medicamentos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-700 text-teal-200 px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-teal-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬅️ Anterior
          </button>
          <span className="text-teal-200 text-lg" style={{ textShadow: "0 0 10px #0ff" }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-gray-700 text-teal-200 px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-teal-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicamentosTable;
