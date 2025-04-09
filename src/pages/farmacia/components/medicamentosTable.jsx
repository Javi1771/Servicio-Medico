import React, { useState, useEffect } from "react";

//* Función para obtener una cookie por su nombre
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

  // Mapeo de stockStatus proveniente del backend a label y color
  const stockStatusMapping = {
    "stock bajo": { label: "Bajo", color: "bg-red-600" },
    "stock medio": { label: "Medio", color: "bg-yellow-500" },
    "stock alto": { label: "Bueno", color: "bg-green-500" },
  };

  // Filtrar por medicamento, clasificación, EAN o piezas
  const filteredMedicamentos = medicamentos.filter((med) =>
    [med.medicamento, med.clasificacion, String(med.ean), String(med.piezas)]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación
  const totalPages = Math.ceil(filteredMedicamentos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const medicamentosPaginados = filteredMedicamentos.slice(startIndex, endIndex);

  // Función para formatear el precio si deseas mostrar el símbolo y dos decimales
  const formatPrecio = (precio) => {
    if (precio == null) return "Sin Precio";
    // Opcionalmente, usar Intl.NumberFormat para formateo local:
    // return new Intl.NumberFormat('es-MX', {
    //   style: 'currency',
    //   currency: 'MXN'
    // }).format(precio);
    return `$${precio.toFixed(2)}`;
  };

  return (
    <div className="w-full mx-auto p-8 bg-gradient-to-br from-[#040f0f] to-[#0c1e1e] rounded-3xl border border-teal-500 border-opacity-40 shadow-[0_0_30px_#0ff]">
      <h2
        className="text-5xl font-extrabold text-teal-300 mb-8 text-center tracking-wider uppercase"
        style={{ textShadow: "0 0 15px #0ff" }}
      >
        📋 Medicamentos Registrados
      </h2>

      {/* Campo de búsqueda */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="🔍 Buscar Medicamento, Clasificación, EAN..."
          className="w-2/3 p-4 rounded-full bg-[#0b2424] text-teal-200 border border-teal-500 focus:ring-4 focus:ring-teal-400 transition duration-300 shadow-[0_0_10px_#0ff] outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de medicamentos */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-lg bg-[#0b2424] text-teal-200 rounded-xl shadow-xl border border-teal-500 border-opacity-40">
          <thead className="bg-teal-800/60 text-teal-100 uppercase tracking-widest text-sm">
            <tr>
              {[
                "Medicamento",
                "Clasificación",
                "Presentación",
                "EAN",
                "Piezas",
                "Máximo",
                "Mínimo",
                "Precio", // <--- Nueva columna Precio
                "Estado",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-5 text-center border-b border-teal-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicamentosPaginados.length > 0 ? (
              medicamentosPaginados.map((med) => {
                const status =
                  stockStatusMapping[med.stockStatus.toLowerCase()] || {
                    label: med.stockStatus,
                    color: "bg-gray-500",
                  };

                return (
                  <tr key={med.id}>
                    <td className="py-3 px-5 text-center">{med.medicamento}</td>
                    <td className="py-3 px-5 text-center">
                      {
                        classificationMapping[med.clasificacion?.toLowerCase()] ||
                        med.clasificacion
                      }
                    </td>
                    <td className="py-3 px-5 text-center">
                      {`${med.presentacion || "Sin Presentación"} ${
                        med.unidadMedida || "Sin Unidad de Medida"
                      }`}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {med.ean || "Sin EAN"}
                    </td>
                    <td className="py-3 px-5 text-center">{`(${
                      med.piezas ?? "Sin Piezas"
                    }) en stock`}</td>
                    <td className="py-3 px-5 text-center">
                      {med.maximo || "Sin Máximos"}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {med.minimo || "Sin Mínimos"}
                    </td>
                    {/* Nueva celda para Precio */}
                    <td className="py-3 px-5 text-center">
                      {formatPrecio(med.precio)}
                    </td>
                    {/* Estado (stock) */}
                    <td className="py-3 px-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-white ${status.color} shadow-[0_0_10px_#0ff]`}
                      >
                        {status.label}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="py-3 px-5 flex justify-center space-x-3">
                      <button
                        onClick={() => onEdit?.(med)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg border border-teal-500 hover:bg-teal-500 hover:text-gray-900 transition duration-300 shadow-[0_0_10px_#0ff]"
                      >
                        ✏️ Editar
                      </button>
                      {/* Mostrar botón eliminar solo si el rol NO es "9" */}
                      {String(role) !== "9" && (
                        <button
                          onClick={() => onDelete?.(med.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg border border-teal-500 hover:bg-red-500 transition duration-300 shadow-[0_0_10px_#0ff]"
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
                <td colSpan="10" className="text-center py-6 text-gray-400">
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
            className="bg-teal-900 text-teal-200 px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-teal-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬅️ Anterior
          </button>
          <span
            className="text-teal-200 text-lg px-3 py-2 border border-teal-600 rounded-full"
            style={{ textShadow: "0 0 10px #0ff" }}
          >
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="bg-teal-900 text-teal-200 px-4 py-2 rounded-lg border border-teal-500 shadow-[0_0_10px_#0ff] hover:bg-teal-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicamentosTable;
