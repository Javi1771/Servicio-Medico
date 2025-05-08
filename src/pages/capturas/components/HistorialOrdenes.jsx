// components/HistorialOrdenes.jsx
import React, { useState, useEffect } from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";
import { useRouter } from "next/router";

const HistorialOrdenes = () => {
  const router = useRouter();
  const [historial, setHistorial] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true); //* Estado para el loader
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await fetch("/api/laboratorio/recientes");
        if (res.ok) {
          const data = await res.json();
          setHistorial(data);
        } else {
          console.error("Error al obtener el historial:", res.statusText);
        }
      } catch (error) {
        console.error("Error al obtener el historial:", error);
      } finally {
        setLoading(false); //* Finalizamos la carga
      }
    };

    fetchHistorial();
  }, []);

  //* Filtrar por folio, nómina o nombre del paciente
  const filteredHistorial = historial.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.CLAVECONSULTA.toString().toLowerCase().includes(term) ||
      item.NOMINA.toString().toLowerCase().includes(term) ||
      item.NOMBRE_PACIENTE.toLowerCase().includes(term)
    );
  });

  //* Paginación
  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredHistorial.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleRowClick = (item) => {
    const encryptedClaveConsulta = btoa(item.CLAVECONSULTA.toString().trim());
    router.push(
      `/capturas/laboratorio/ver-ordenes?claveconsulta=${encryptedClaveConsulta}`
    );
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  //* Loader animado
  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <FaSpinner className="animate-spin text-6xl text-black" />
      </div>
    );
  }

  return (
    <div className="bg-[#CBFFFE]/50 p-4 rounded-xl shadow-md">
      {/* Buscador */}
      <div className="flex items-center mb-4">
        <FaSearch className="text-[#0084A9] mr-2" />
        <input
          type="text"
          placeholder="Buscar por folio, nómina o nombre..."
          className="w-full p-2 border border-[#5BFCFF] rounded-xl focus:outline-none focus:border-[#00E6FF] focus:ring-2 focus:ring-[#00E6FF] text-[#00576A]"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); //* Reiniciamos la paginación al cambiar búsqueda
          }}
        />
      </div>

      {/* Tabla de historiales */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EAFFFE]">
              <th className="p-3 border border-[#9BFFFF] text-[#00576A]">
                Folio Consulta
              </th>
              <th className="p-3 border border-[#9BFFFF] text-[#00576A]">
                Nómina
              </th>
              <th className="p-3 border border-[#9BFFFF] text-[#00576A]">
                Nombre Paciente
              </th>
              <th className="p-3 border border-[#9BFFFF] text-[#00576A]">
                Edad
              </th>
              <th className="p-3 border border-[#9BFFFF] text-[#00576A]">
                Departamento
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#CBFFFE] transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="p-3 border border-[#9BFFFF] text-[#00576A]">
                    {item.CLAVECONSULTA}
                  </td>
                  <td className="p-3 border border-[#9BFFFF] text-[#00576A]">
                    {item.NOMINA}
                  </td>
                  <td className="p-3 border border-[#9BFFFF] text-[#00576A]">
                    {item.NOMBRE_PACIENTE}
                  </td>
                  <td className="p-3 border border-[#9BFFFF] text-[#00576A]">
                    {item.EDAD}
                  </td>
                  <td className="p-3 border border-[#9BFFFF] text-[#00576A]">
                    {item.DEPARTAMENTO}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-3 text-center text-[#00576A] font-medium"
                >
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-[#00CEFF] text-[#00384B] font-bold rounded-xl shadow-lg hover:bg-[#0093D0] transition transform hover:scale-105 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-[#00576A]">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-[#00CEFF] text-[#00384B] font-bold rounded-xl shadow-lg hover:bg-[#0093D0] transition transform hover:scale-105 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default HistorialOrdenes;
