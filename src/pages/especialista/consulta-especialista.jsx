import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaTable } from "react-icons/fa";

const PasesNuevoEspecialista = () => {
  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  // Función para cargar los datos desde el endpoint
  const fetchData = async () => {
    try {
      const response = await fetch("/api/especialidades/paseNuevoEspecialista");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
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

  // Manejo del buscador
  const handleBusqueda = (e) => {
    const value = e.target.value.toLowerCase();
    setBusqueda(value);
    const filtered = datos.filter(
      (item) =>
        item.paciente.toLowerCase().includes(value) ||
        item.especialidad.toLowerCase().includes(value) ||
        item.nomina.toLowerCase().includes(value)
    );
    setFilteredData(filtered);
  };

  // Manejo de clic en una fila
  const handleRowClick = (folio) => {
    router.push(`/detalle/especialista/${folio}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-800 text-gray-300 p-6">
      {/* Header */}
      <header className="bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-teal-300 flex items-center gap-4">
          <FaTable className="text-teal-400" />
          Pase a Especialidades
        </h1>
      </header>

      {/* Buscador */}
      <section className="mb-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center">
            <FaSearch className="text-teal-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Buscar por paciente, especialidad o nómina"
            value={busqueda}
            onChange={handleBusqueda}
            className="w-full pl-12 py-3 bg-gray-700 rounded-full text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-teal-400 outline-none"
          />
        </div>
      </section>

      {/* Tabla */}
      <section className="overflow-x-auto">
        <table className="w-full table-auto bg-gray-800 text-left rounded-xl shadow-md">
          <thead className="bg-teal-700 text-gray-100">
            <tr>
              <th className="p-4">Especialidad</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Nómina</th>
              <th className="p-4">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="p-4">
                    <div className="h-6 w-20 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-32 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-24 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-32 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-16 bg-gray-600 rounded"></div>
                  </td>
                </tr>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr
                  key={item.folio}
                  className="cursor-pointer hover:bg-gray-700 transition-all"
                  onClick={() => handleRowClick(item.folio)}
                >
                  <td className="p-4">{item.especialidad}</td>
                  <td className="p-4">{item.paciente}</td>
                  <td className="p-4">{item.fecha}</td>
                  <td className="p-4">{item.nomina}</td>
                  <td
                    className={`p-4 font-bold ${
                      item.estatus === "EN ESPERA"
                        ? "text-red-400"
                        : "text-teal-400"
                    }`}
                  >
                    {item.estatus}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-4 text-center text-gray-500 border-b border-gray-700"
                >
                  No se encontraron datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PasesNuevoEspecialista;
