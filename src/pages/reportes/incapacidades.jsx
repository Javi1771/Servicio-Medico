import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import {
  FaUserMd,
  FaCalendarAlt,
  FaNotesMedical,
  FaClock,
  FaExclamationTriangle,
  FaIdCard,
  FaHourglassHalf,
  FaSearch,
  FaArrowLeft,
} from "react-icons/fa";

const IncapacidadesDashboard = () => {
  const [incapacidades, setIncapacidades] = useState([]);
  const [filteredIncapacidades, setFilteredIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const tapSound = useRef(null);

  useEffect(() => {
    tapSound.current = new Audio("/assets/tap.mp3");
  }, []);

  const playTapSound = () => {
    if (tapSound.current) {
      tapSound.current.currentTime = 0;
      tapSound.current.play();
    }
  };

  useEffect(() => {
    const fetchIncapacidades = async () => {
      try {
        const response = await fetch("/api/incapacidades/historialRH");
        if (!response.ok) throw new Error("Error al obtener las incapacidades.");
        const data = await response.json();
        setIncapacidades(data.historial);
        setFilteredIncapacidades(data.historial);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIncapacidades();
  }, []);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = incapacidades.filter((item) =>
      item.nombrepaciente.toLowerCase().includes(lowerSearch) ||
      item.nomina.toLowerCase().includes(lowerSearch)
    );
    setFilteredIncapacidades(filtered);
  }, [searchTerm, incapacidades]);

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      <div className="relative z-10 flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
        >
          <FaArrowLeft />
          <span className="hidden sm:inline">Regresar</span>
        </button>
        <motion.h1
          className="text-5xl font-extrabold uppercase neon-text text-center flex-1"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          🌟 Historial de Incapacidades 🌟
        </motion.h1>
        <div className="w-24" />
      </div>

      <div className="relative z-10 flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar por nómina o nombre..."
            className="w-full bg-gray-900 text-white text-lg py-3 px-5 rounded-full border border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 text-xl" />
        </div>
      </div>

      {loading && (
        <p className="text-center text-lg animate-pulse text-cyan-400">
          Cargando incapacidades...
        </p>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIncapacidades.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              No se encontraron resultados.
            </p>
          ) : (
            filteredIncapacidades.map((incapacidad, index) => {
              const isVencida = !!incapacidad.alerta;
              const isActiva = !isVencida && incapacidad.diasRestantes !== null;
              const isFutura = incapacidad.futura;

              return (
                <motion.div
                  key={index}
                  onMouseEnter={playTapSound}
                  className={`relative rounded-2xl p-6 shadow-lg transition-all duration-300 overflow-hidden backdrop-blur-lg 
                    ${
                      isVencida
                        ? "bg-red-900/70 border border-red-500 hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.6)]"
                        : isFutura
                        ? "bg-blue-900/70 border border-blue-500 hover:shadow-[0px_0px_30px_10px_rgba(0,200,255,0.6)]"
                        : "bg-gray-900/70 border border-cyan-500 hover:shadow-[0px_0px_30px_10px_rgba(0,255,255,0.6)]"
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <h2
                    className={`text-3xl font-bold flex items-center gap-2 
                      ${
                        isVencida
                          ? "text-red-300"
                          : isFutura
                          ? "text-blue-400"
                          : "text-cyan-400"
                      }`}
                  >
                    <FaUserMd /> {incapacidad.nombrepaciente}
                  </h2>
                  <h2 className="text-xl text-gray-300 flex items-center gap-2 mt-2">
                    <FaIdCard className="text-yellow-400" /> Nómina: {incapacidad.nomina}
                  </h2>
                  <p className="text-gray-300 text-md flex items-center gap-2 mt-3">
                    <FaCalendarAlt className="text-yellow-400" /> <b>Inicio:</b> {incapacidad.fechainicio}
                  </p>
                  <p className="text-gray-300 text-md flex items-center gap-2">
                    <FaClock className="text-red-400" /> <b>Fin:</b> {incapacidad.fechafin}
                  </p>
                  <p className="text-gray-300 text-md flex items-center gap-2 mt-3">
                    <FaNotesMedical className="text-green-400" /> <b>Observaciones:</b> {incapacidad.observaciones || "N/A"}
                  </p>
                  <div className="mt-4 text-md text-gray-400 border-t border-gray-500/50 pt-3">
                    <p className="flex items-center gap-2">
                      <FaUserMd className="text-blue-400" /> <b>Médico:</b> {incapacidad.clavemedico_nombre || "Desconocido"}
                    </p>
                    <p className="flex items-center gap-2">
                      🏥 <b>Especialidad:</b> {incapacidad.especialidad_clavemedico || "N/A"}
                    </p>
                  </div>
                  {isVencida && (
                    <motion.div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600/40 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-xl">
                      <FaExclamationTriangle className="text-lg" />
                      <span>Incapacidad vencida hace {incapacidad.alerta}</span>
                    </motion.div>
                  )}
                  {isActiva && (
                    <motion.div className="absolute bottom-3 right-3 flex items-center gap-2 bg-green-600/40 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-xl">
                      <FaHourglassHalf className="text-lg" />
                      <span>{incapacidad.diasRestantes} días restantes</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default IncapacidadesDashboard;