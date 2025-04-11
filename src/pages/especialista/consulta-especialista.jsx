import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaSearch,
  FaUserMd,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const PasesNuevoEspecialista = () => {
  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();
  
  const handleRegresar = () => {
    router.replace('/inicio-servicio-medico'); //* Redirige a /inicio-servicio-medico
  };

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

  //* Manejo de clic en una fila (solo si no ha sido atendido)
  const handleRowClick = (claveconsulta, atendido) => {
    if (!atendido) {
      //* Cifrar claveconsulta en Base64
      const encryptedClaveConsulta = btoa(claveconsulta.toString());
  
      //* Redirigir con el valor cifrado
      router.push(
        `/especialista/detalles-especialidad?claveconsulta=${encryptedClaveConsulta}`
      );
    }
  };
  

  return (
    <div className="min-h-screen bg-black text-gray-200 px-4 sm:px-8 lg:px-16 xl:px-32 py-6">
      <header className="bg-gradient-to-r from-purple-700 via-blue-500 to-teal-400 rounded-xl shadow-xl p-8 mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white flex justify-center items-center gap-4">
          <FaUserMd className="text-white text-6xl" />
          Pases a Especialidades
        </h1>

      {/* Botón regresar */}
  <div className="flex justify-start mb-12">
    <button
      onClick={handleRegresar}
      className="relative px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
    >
      ← Regresar
    </button>
  </div>
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
        <table className="w-full table-auto bg-black text-left rounded-xl shadow-lg border border-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
          <thead className="bg-gradient-to-r from-purple-900 via-blue-700 to-teal-600 text-white shadow-md">
            <tr>
              <th className="p-5">
                <FaCalendarAlt className="inline mr-2" /> Fecha de la Cita
              </th>
              <th className="p-5">
                <FaFileAlt className="inline mr-2" /> Nómina
              </th>
              <th className="p-5">
                <FaUser className="inline mr-2" /> Paciente
              </th>
              <th className="p-5">
                <FaUser className="inline mr-2" /> Sindicato
              </th>
              <th className="p-5">
                <FaUserMd className="inline mr-2" /> Médico Referente
              </th>
              <th className="p-5">
                <FaFileAlt className="inline mr-2" /> Especialidad
              </th>
              <th className="p-5">
                <FaExclamationTriangle className="inline mr-2" /> Estatus
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {[...Array(7)].map((_, i) => (
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
                  className={`relative group ${
                    item.atendido
                      ? "bg-gray-800 text-gray-500 cursor-default"
                      : "hover:bg-gray-800 cursor-pointer"
                  } transition-all duration-300 border-b border-purple-500`}
                  onClick={() =>
                    handleRowClick(item.claveconsulta, item.atendido)
                  }
                >
                  <td className="p-5">{item.fechacita || "No disponible"}</td>
                  <td className="p-5">{item.clavenomina || "No disponible"}</td>
                  <td className="p-5">
                    {item.nombrepaciente || "No disponible"}
                  </td>

                  <td
                    className={`p-5 ${
                      item.atendido
                        ? "text-gray-500" //* Si ya fue atendido, gris
                        : item.sindicato
                        ? "text-[#00FFFF]" //* Azul neón si tiene sindicato
                        : "text-white" //* Blanco si no tiene sindicato
                    }`}
                  >
                    {item.sindicato || "No disponible"}
                  </td>

                  <td className="p-5">
                    {item.nombreUsuarioProveedor || "No disponible"}
                  </td>
                  <td className="p-5">
                    {item.nombreEspecialidadUsuario || "Sin especialidad"}
                  </td>

                  {/* Columna de estatus con tooltip */}
                  <td className="p-5 relative group">
                    <div className="flex items-center gap-2">
                      {item.atendido ? (
                        <>
                          <FaCheckCircle className="text-green-400 text-lg" />
                          <span className="text-green-400 font-semibold">
                            Atendido
                          </span>

                          {/* Determinar la posición del tooltip según la fila */}
                          <div
                            className={`absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 
                  ${
                    index < 3 ? "top-full" : "bottom-full"
                  } right-0 w-[350px] max-w-[400px] transition-all duration-300 ease-out z-50`}
                            style={{
                              whiteSpace: "normal",
                              overflow: "visible",
                              paddingTop: index < 3 ? "10px" : "0",
                              paddingBottom: index >= 3 ? "10px" : "0",
                            }}
                          >
                            <div className="relative px-8 py-5 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.9)]">
                              {/* Fondo animado de brillo */}
                              <div className="absolute inset-0 rounded-2xl blur-xl opacity-75 animate-pulse bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30"></div>

                              {/* Contenido del tooltip */}
                              <div className="relative text-center">
                                <div className="flex items-center gap-3 mb-3 justify-center">
                                  {/* Icono informativo */}
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20">
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-5 h-5 text-indigo-400"
                                    >
                                      <path
                                        clipRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        fillRule="evenodd"
                                      ></path>
                                    </svg>
                                  </div>

                                  {/* Título del tooltip */}
                                  <h3 className="text-lg font-bold text-white">
                                    No editable
                                  </h3>
                                </div>

                                {/* Texto explicativo */}
                                <p className="text-base text-gray-300 leading-relaxed">
                                  Esta consulta ya ha sido atendida y está lista
                                  para pasar con el especialista.
                                </p>
                              </div>

                              {/* Fondo decorativo adicional */}
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl opacity-50"></div>

                              {/* Flecha del tooltip (cambia según la orientación) */}
                              <div
                                className={`absolute right-5 transform w-4 h-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-r border-b border-white/10 
                      ${
                        index < 3
                          ? "bottom-full translate-y-2"
                          : "top-full -translate-y-2"
                      } rotate-45`}
                              ></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="text-red-400 text-lg" />
                          <span className="text-red-400 font-semibold">
                            Pendiente
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="p-5 text-center text-gray-500 bg-gray-800 italic"
                >
                  No se encontraron resultados.
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
