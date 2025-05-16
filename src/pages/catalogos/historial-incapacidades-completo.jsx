import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSearch, FaSpinner, FaTimes } from "react-icons/fa";

const HistorialCompletoPage = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const router = useRouter();

  const handleRegresar = () => {
    router.push("/inicio-servicio-medico");
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/incapacidades/historialCompleto");
        const { historial = [] } = await res.json();
        setHistorial(historial);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRowClick = (clave) => {
    router.push(
      `/catalogos/components/ver-incapacidad?claveconsulta=${btoa(
        String(clave).trim()
      )}`
    );
  };

  //* Filtrado seguro coerción a string
  const filtered = historial.filter((item) => {
    const term = searchTerm.toLowerCase();
    const nomina = String(item.nomina || "").toLowerCase();
    const folio = String(item.claveconsulta || "").toLowerCase();
    const paciente = String(item.nombrepaciente || "").toLowerCase();
    return (
      nomina.includes(term) || folio.includes(term) || paciente.includes(term)
    );
  });

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(start, start + itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900">
        <FaSpinner className="animate-spin text-6xl text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white py-16 px-4 sm:px-16">
      <button
        onClick={handleRegresar}
        className="absolute top-4 left-4 px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
      >
        ← Regresar
      </button>
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl sm:text-6xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-lg"
      >
        Historial Completo de Incapacidades
      </motion.h1>

      {/* Search */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mx-auto max-w-2xl flex items-center bg-gray-800/60 border border-cyan-500 rounded-full px-5 py-2 mb-8 shadow-md hover:shadow-cyan-600 transition-shadow"
      >
        <FaSearch className="text-cyan-400 text-2xl mr-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nómina, folio o nombre"
          className="flex-grow bg-transparent focus:outline-none placeholder-gray-400 text-lg text-white"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="ml-3">
            <FaTimes className="text-gray-400 hover:text-white transition-colors" />
          </button>
        )}
      </motion.div>

      {/* Table card con mayor ancho */}
      <div className="relative mx-auto w-full max-w-screen-xl bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-cyan-600/50 shadow-xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-cyan-500 opacity-20 animate-pulse" />
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0">
                {[
                  "Folio Consulta",
                  "Inicio",
                  "Fin",
                  "Nómina",
                  "Nombre Paciente",
                  "Observaciones",
                  "Días Restantes",
                  "Futura",
                ].map((h) => (
                  <th
                    key={h}
                    className="p-4 text-sm font-semibold uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length > 0 ? (
                pageItems.map((item, i) => (
                  <motion.tr
                    key={i}
                    onClick={() => handleRowClick(item.claveconsulta)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`cursor-pointer transition-colors ${
                      i % 2 === 0 ? "bg-gray-800/50" : "bg-gray-800/30"
                    } hover:bg-purple-700/50`}
                  >
                    <td className="p-4 text-sm">{item.claveconsulta}</td>
                    <td className="p-4 text-sm">{item.fechainicio}</td>
                    <td className="p-4 text-sm">{item.fechafin}</td>
                    <td className="p-4 text-sm">{item.nomina}</td>
                    <td className="p-4 text-sm">{item.nombrepaciente}</td>
                    <td
                      className="p-4 text-sm truncate max-w-xs"
                      title={item.observaciones}
                    >
                      {item.observaciones}
                    </td>
                    <td className="p-4 text-sm">
                      {item.diasRestantes != null ? (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            item.diasRestantes < 5
                              ? "bg-red-600 text-white"
                              : item.diasRestantes < 10
                              ? "bg-yellow-500 text-black"
                              : "bg-green-600 text-white"
                          }`}
                        >
                          {item.diasRestantes} día
                          {item.diasRestantes !== 1 && "s"}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{item.futura ? "Sí" : "No"}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 transition"
          >
            Anterior
          </button>
          <span className="text-gray-300">
            Página{" "}
            <span className="font-semibold text-white">{currentPage}</span> de{" "}
            <span className="font-semibold text-white">{totalPages}</span>
          </span>
          <button
            onClick={() =>
              currentPage < totalPages && setCurrentPage((p) => p + 1)
            }
            disabled={currentPage === totalPages}
            className="px-5 py-2 bg-cyan-500 rounded-full hover:bg-cyan-400 disabled:opacity-50 transition"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default HistorialCompletoPage;
