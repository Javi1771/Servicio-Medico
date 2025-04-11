/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaClipboardList, FaPlus } from "react-icons/fa";

const PasesAEspecialidad = () => {
  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  //* Función para cargar los datos desde el backend
  const fetchData = async () => {
    try {
      const response = await fetch("/api/especialidades/pases-especialidad");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const data = await response.json();
      const uniqueData = data.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.folio === item.folio)
      );
      setDatos(uniqueData);
      setFilteredData(uniqueData);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  //* Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  //* Manejo del buscador
  const handleBusqueda = (e) => {
    const value = e.target.value.toLowerCase();
    setBusqueda(value);

    const filtered = datos.filter((item) => {
      const nominaMatches =
        item.nomina && item.nomina.toString().toLowerCase().includes(value);

      const folioMatches =
        item.folio && item.folio.toString().toLowerCase().includes(value);

      //* Retorna true si coincide con nómina o con folio
      return nominaMatches || folioMatches;
    });

    setFilteredData(filtered);
  };

  const handleRowClick = (folio, estatus) => {
    if (estatus === "LISTA PARA PASAR CON EL ESPECIALISTA") {
    } else {
      //* Cifrar el folio con Base64
      const encryptedFolio = btoa(folio.toString());
      //* Redirigir a la pantalla para crear el pase con el folio encriptado
      router.push(
        `/capturas/pases/crear-pase?claveconsulta=${encryptedFolio}`
      );
    }
  };

  const handleRegresar = () => {
    router.replace("/inicio-servicio-medico"); //* Navegar a la pantalla anterior
  };

  const handleHistorial = () => {
    router.push("/capturas/pases/pases-creados");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-teal-700 text-white py-8 px-6">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-800 to-teal-700 rounded-2xl p-8 text-center shadow-xl">
        {/* Botón de Regresar posicionado a la izquierda */}
        <button
          onClick={handleRegresar}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
        >
          ← Regresar
        </button>
        <button
          onClick={handleHistorial}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
        >
          Ver Historial de Pases De Consultas Generales
        </button>

        <h1 className="text-5xl font-extrabold tracking-wide flex items-center justify-center gap-4 text-teal-300">
          <FaClipboardList className="text-teal-400" />
          Pases a Especialidad
        </h1>
        <button
          onClick={() => router.push("/capturas/pases/crear-pase-nuevo")}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-lg font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300"
        >
          <FaPlus className="inline-block mr-2" /> Nuevo Pase
        </button>
      </header>

      {/* Buscador */}
      <section className="py-8 px-4 md:px-10">
        <div className="relative flex items-center w-full max-w-lg mx-auto">
          <div className="absolute left-4 h-10 w-10 bg-gradient-to-r from-blue-700 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
            <FaSearch className="text-white text-xl" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Nómina o por Folio de Consulta"
            value={busqueda}
            onChange={handleBusqueda}
            className="pl-14 py-3 w-full rounded-full bg-gray-800 text-white placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition-all"
          />
        </div>
      </section>

      {/* Tabla de resultados */}
      <section className="px-4 md:px-10">
        <table className="w-full text-left border-collapse bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-teal-300">
            <tr>
              <th className="p-4">Folio de la Consulta</th>
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
                  className={`relative group ${
                    item.estatus === "LISTA PARA PASAR CON EL ESPECIALISTA"
                      ? "bg-gray-700 bg-opacity-50 text-gray-400 cursor-default"
                      : "hover:bg-gray-700 cursor-pointer"
                  } transition-all`}
                  onClick={() => handleRowClick(item.folio, item.estatus)}
                >
                  <td className="p-4 border-b border-gray-700">{item.folio}</td>
                  <td className="p-4 border-b border-gray-700">
                    {item.especialidad}
                  </td>
                  <td className="p-4 border-b border-gray-700">
                    {item.paciente}
                  </td>
                  <td className="p-4 border-b border-gray-700">{item.fecha}</td>
                  <td className="p-4 border-b border-gray-700">
                    {item.nomina}
                  </td>
                  <td
                    className={`relative p-4 border-b border-gray-700 font-bold ${
                      item.estatus ===
                      "EN ESPERA PARA ASIGNACIÓN DE FECHA DE CITA"
                        ? "text-red-400"
                        : "text-teal-400"
                    } group`}
                  >
                    {item.estatus}

                    {/* Tooltip visible al pasar el cursor */}
                    {item.estatus ===
                      "LISTA PARA PASAR CON EL ESPECIALISTA" && (
                      <div
                        className={`absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 ${
                          datos.indexOf(item) === 0 || datos.indexOf(item) === 1
                            ? "top-full translate-y-2"
                            : "bottom-full -translate-y-2"
                        } left-1/2 transform -translate-x-1/2 w-auto max-w-xs transition-all duration-300 ease-out z-50`}
                      >
                        <div className="relative p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                          <div className="absolute inset-0 rounded-2xl blur-xl opacity-75 animate-pulse bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30"></div>
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20">
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 text-indigo-400"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    fillRule="evenodd"
                                  ></path>
                                </svg>
                              </div>
                              <h3 className="text-sm font-bold text-white">
                                No editable
                              </h3>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-300">
                                Esta consulta no se puede editar porque ya ha
                                sido atendida y está lista para pasar con el
                                especialista.
                              </p>
                            </div>
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl opacity-50"></div>
                          <div
                            className={`absolute ${
                              datos.indexOf(item) === 0 ||
                              datos.indexOf(item) === 1
                                ? "top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45"
                                : "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45"
                            } w-3 h-3 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-r border-b border-white/10`}
                          ></div>
                        </div>
                      </div>
                    )}
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

export default PasesAEspecialidad;
