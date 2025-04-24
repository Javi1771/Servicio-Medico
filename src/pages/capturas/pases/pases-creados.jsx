import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaSearch,
  FaRegEye,
  FaCalendarAlt,
  FaUser,
  FaIdBadge,
  FaClipboardList,
  FaTag,
} from "react-icons/fa";

const PasesDashboard = () => {
  const [datos, setDatos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  //* Cargar datos desde el endpoint
  const fetchData = async () => {
    try {
      const response = await fetch("/api/especialidades/obtenerFolioNuevo");
      if (!response.ok) throw new Error("Error al cargar los datos");
      const data = await response.json();

      //* Procesar los datos para asignar folio, nomina y estatus
      const processedData = data.map((item) => ({
        ...item,
        folio: item.claveconsulta,
        nomina: item.clavenomina,
        estatus: item.diagnostico === null ? "Pendiente" : "Paciente Atendido",
      }));

      setDatos(processedData);
      setFilteredData(processedData);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  //* Filtrado por nómina o folio
  const handleBusqueda = (e) => {
    const value = e.target.value.toLowerCase();
    setBusqueda(value);

    const filtered = datos.filter((item) => {
      const nominaMatches =
        item.nomina && item.nomina.toLowerCase().includes(value);
      const folioMatches =
        item.folio && item.folio.toString().toLowerCase().includes(value);
      return nominaMatches || folioMatches;
    });
    setFilteredData(filtered);
  };

  //* Si diagnóstico es null, se permite clic y se redirige a ver recetas
  const handleCardClick = (folio, diagnostico) => {
    if (diagnostico === null) {
      const encryptedFolio = btoa(folio.toString());
      router.push(
        `/capturas/recetas/ver-recetas-pases?claveconsulta=${encryptedFolio}`
      );
    }
  };

  //* Botón para regresar
  const handleRegresar = () => {
    router.push("/capturas/pases-a-especialidades");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 px-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Botón Regresar */}
            <button
              onClick={handleRegresar}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition"
            >
              ← Regresar
            </button>
            <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              <FaClipboardList className="text-4xl text-blue-500" />
              Historial de Pases
            </h2>
          </div>
          <div className="relative w-80">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Buscar por Nómina o Folio"
              value={busqueda}
              onChange={handleBusqueda}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          Consulta y gestiona las recetas pendientes.
        </p>
      </header>

      {/* Contenedor flexible con wrap */}
      <div className="max-w-7xl mx-auto flex flex-wrap gap-6">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[300px] max-w-[420px] bg-white border border-gray-300 rounded-3xl shadow animate-pulse p-8"
            >
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
          ))
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div
              key={item.folio}
              onClick={() => handleCardClick(item.folio, item.diagnostico)}
              className={`relative overflow-hidden flex-1 min-w-[300px] max-w-[420px] bg-white rounded-3xl shadow-lg transition-transform p-8 ${
                item.diagnostico === null
                  ? "cursor-pointer hover:shadow-2xl"
                  : "cursor-default opacity-70"
              }`}
              style={{ minHeight: "420px" }} 
            >
              {/* Círculo interior (top-right) */}
              {item.diagnostico === null && (
                <div className="absolute top-4 right-4 w-20 h-20 bg-blue-500 opacity-20 rounded-full z-0"></div>
              )}

              {/* Contenido principal */}
              <div className="relative z-10 space-y-4">
                {/* Folio */}
                <div className="flex items-center gap-2">
                  <FaIdBadge className="text-xl text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Folio
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.folio}
                    </p>
                  </div>
                </div>

                {/* Especialidad */}
                <div className="flex items-center gap-2">
                  <FaTag className="text-lg text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Especialidad
                    </p>
                    <p className="text-lg text-gray-800">
                      {item.especialidad || "Sin especialidad"}
                    </p>
                  </div>
                </div>

                {/* Paciente */}
                <div className="flex items-center gap-2">
                  <FaUser className="text-lg text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Paciente
                    </p>
                    <p className="text-lg text-gray-800">
                      {item.nombrepaciente || "No disponible"}
                    </p>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-lg text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Fecha
                    </p>
                    <p className="text-lg text-gray-800">
                      {item.fechacita || "No disponible"}
                    </p>
                  </div>
                </div>

                {/* Nómina */}
                <div className="flex items-center gap-2">
                  <FaIdBadge className="text-lg text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Nómina
                    </p>
                    <p className="text-lg text-gray-800">
                      {item.nomina || "No disponible"}
                    </p>
                  </div>
                </div>

                {/* Estatus */}
                <div className="flex items-center gap-2">
                  <FaRegEye className="text-lg text-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-500">
                      Estatus
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {item.estatus}
                    </p>
                  </div>
                </div>

                {/* Botón “Ver Recetas” */}
                {item.diagnostico === null && (
                  <div className="pt-4 text-center">
                    <button className="py-2 px-6 bg-blue-500 text-white rounded-full font-bold tracking-wider hover:bg-blue-600 transition">
                      Ver Pases
                    </button>
                  </div>
                )}
              </div>

              {/* Borde inferior neon */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full z-10"></div>
            </div>
          ))
        ) : (
          <p className="text-center text-2xl text-gray-500 w-full">
            No se encontraron datos.
          </p>
        )}
      </div>
    </div>
  );
};

export default PasesDashboard;
