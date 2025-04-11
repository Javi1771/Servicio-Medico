import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSearch, FaSpinner } from "react-icons/fa";

const HistorialCompletoPage = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  //* Consulta al endpoint al cargar el componente
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch("/api/incapacidades/historialCompleto");
        const data = await response.json();
        setHistorial(data.historial || []);
      } catch (error) {
        console.error("Error al obtener el historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  //* Al hacer clic en una fila, encriptamos la clave y redirigimos
  const handleRowClick = (claveconsulta) => {
    const encryptedClaveConsulta = btoa(String(claveconsulta).trim());
    router.push(
      `/capturas/incapacidades/ver-incapacidad?claveconsulta=${encryptedClaveConsulta}`
    );
  };

  //* Filtrar el historial por nómina, folio consulta o nombre de paciente
  const filteredHistorial = historial.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      String(item.nomina).toLowerCase().includes(term) ||
      String(item.claveconsulta).toLowerCase().includes(term) ||
      String(item.nombrepaciente).toLowerCase().includes(term)
    );
  });

  //* Reiniciar la página actual al cambiar el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  //* Calcular los items a mostrar en la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredHistorial.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  //* Loader animado
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-6xl text-white" />
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white py-8 px-4 sm:px-20 flex flex-col items-center">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
          Historial Completo de Incapacidades
        </h1>
      </motion.div>

      {/* Buscador con diseño mejorado */}
      <div className="max-w-7xl w-full bg-gray-800/70 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-lg border border-gray-700">
        <FaSearch className="text-cyan-400 text-2xl" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nómina, folio o nombre"
          className="w-full bg-transparent text-xl text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      <div className="max-w-7xl w-full bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-cyan-400/50 p-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-3 text-sm font-semibold">Folio Consulta</th>
                <th className="p-3 text-sm font-semibold">Inicio</th>
                <th className="p-3 text-sm font-semibold">Fin</th>
                <th className="p-3 text-sm font-semibold">Nómina</th>
                <th className="p-3 text-sm font-semibold">Nombre Paciente</th>
                <th className="p-3 text-sm font-semibold">Observaciones</th>
                <th className="p-3 text-sm font-semibold">Días Restantes</th>
                <th className="p-3 text-sm font-semibold">Futura</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => (
                  <motion.tr
                    key={idx}
                    onClick={() => handleRowClick(item.claveconsulta)}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300 cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="p-3 border-t border-gray-800">
                      {item.claveconsulta}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.fechainicio}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.fechafin}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.nomina}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.nombrepaciente}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.observaciones}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {/* Diseño para Días Restantes */}
                      {item.diasRestantes !== null ? (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            item.diasRestantes < 5
                              ? "bg-red-600 text-white"
                              : item.diasRestantes < 10
                              ? "bg-yellow-600 text-black"
                              : "bg-green-600 text-white"
                          }`}
                        >
                          {item.diasRestantes} día
                          {item.diasRestantes !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="p-3 border-t border-gray-800">
                      {item.futura ? "Sí" : "No"}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-gray-400">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialCompletoPage;
