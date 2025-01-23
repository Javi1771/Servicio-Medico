import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaUserMd, FaCalendarAlt, FaUser, FaFileAlt } from "react-icons/fa";

const PasesNuevoEspecialista = () => {
  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  //* Cargar datos desde el endpoint
  const fetchData = async () => {
    try {
      const response = await fetch("/api/especialidades/paseNuevoEspecialista");
      if (!response.ok) throw new Error("Error al cargar los datos");

      const data = await response.json();
      setDatos(data);
      setFilteredData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  //* Filtrar datos por búsqueda
  const handleBusqueda = (e) => {
    const value = e.target.value.toLowerCase();
    setBusqueda(value);
    const filtered = datos.filter(
      (item) =>
        item.nombrepaciente?.toLowerCase().includes(value) ||
        item.clavenomina?.toLowerCase().includes(value)
    );
    setFilteredData(filtered);
  };

  //* Manejo de clic en una fila
  const handleRowClick = (claveconsulta) => {
    //* Redirige a la página de detalles con la clave de consulta como parámetro
    router.push(`/especialista/detalles-especialidad?claveconsulta=${claveconsulta}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-800 text-gray-200 px-4 sm:px-8 lg:px-16 xl:px-32 py-6">
      <header className="bg-gradient-to-r from-purple-700 via-blue-500 to-teal-400 rounded-xl shadow-xl p-8 mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white flex justify-center items-center gap-4">
          <FaUserMd className="text-white text-6xl" />
          Pases a Especialidades
        </h1>
      </header>
  
      <section className="mb-10">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center">
            <FaSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Buscar por paciente o nómina"
            value={busqueda}
            onChange={handleBusqueda}
            className="w-full pl-12 py-3 bg-gray-800 text-gray-200 rounded-full focus:ring-4 focus:ring-purple-500 outline-none shadow-lg hover:bg-gray-700 transition-all duration-200"
          />
        </div>
      </section>
  
      <section className="overflow-x-auto">
        <table className="w-full table-auto bg-gradient-to-b from-gray-900 to-gray-800 text-left rounded-xl shadow-lg">
          <thead className="bg-gradient-to-r from-purple-900 via-blue-700 to-teal-600 text-white shadow-md">
            <tr>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaCalendarAlt className="inline mr-2" /> Fecha de la Cita
              </th>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaFileAlt className="inline mr-2" /> Nómina
              </th>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaUser className="inline mr-2" /> Paciente
              </th>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaUser className="inline mr-2" /> Sindicato
              </th>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaUserMd className="inline mr-2" /> Médico Referente
              </th>
              <th className="p-5 text-sm sm:text-lg font-bold uppercase">
                <FaFileAlt className="inline mr-2" /> Especialidad del Médico Referente
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <td key={i} className="p-5">
                      <div className="h-6 w-32 bg-gray-700 rounded-md"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer border-b ${
                    index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                  }`}
                  onClick={() => handleRowClick(item.claveconsulta)}
                  >
                  <td className="p-5 text-gray-300 font-medium text-sm sm:text-base">
                    {item.fechacita || "No disponible"}
                  </td>
                  <td className="p-5 text-gray-300 font-medium text-sm sm:text-base">
                    {item.clavenomina || "No disponible"}
                  </td>
                  <td className="p-5 text-gray-300 font-medium text-sm sm:text-base">
                    {item.nombrepaciente || "No disponible"}
                  </td>
                  <td
                    className={`p-5 font-bold text-sm sm:text-base ${
                      item.sindicato ? "text-teal-400" : "text-red-500 italic"
                    }`}
                  >
                    {item.sindicato || "No disponible"}
                  </td>
                  <td className="p-5 text-gray-300 font-medium text-sm sm:text-base">
                    {item.nombreUsuarioProveedor || "No disponible"}
                  </td>
                  <td className="p-5 text-gray-300 font-medium text-sm sm:text-base">
                    {item.nombreEspecialidadUsuario || "Sin especialidad"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-5 text-center text-gray-500 bg-gray-800 italic"
                >
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
  
      <footer className="text-center mt-10">
        <p className="text-gray-500 text-sm">
          © 2025 Pases a Especialidades. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
  
};

export default PasesNuevoEspecialista;
