import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaUserMd,
  FaCalendarAlt,
  FaNotesMedical,
  FaClock,
  FaExclamationTriangle,
  FaIdCard,
  FaHourglassHalf,
  FaHourglassStart,
} from "react-icons/fa";

const IncapacidadesDashboard = () => {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncapacidades = async () => {
      try {
        const response = await fetch("/api/incapacidades/historialRH");
        if (!response.ok)
          throw new Error("Error al obtener las incapacidades.");
        const data = await response.json();
        setIncapacidades(data.historial);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIncapacidades();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* 🔥 FONDO ANIMADO */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {/* 🟢 TÍTULO NEÓN */}
      <motion.h1
        className="relative z-10 text-5xl font-extrabold text-center mb-10 neon-text uppercase"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        🌟 Historial de Incapacidades 🌟
      </motion.h1>

      {/* 🔄 CARGA Y ERRORES */}
      {loading && (
        <p className="text-center text-lg animate-pulse text-cyan-400">
          Cargando incapacidades...
        </p>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {incapacidades.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              No hay incapacidades activas.
            </p>
          ) : (
            incapacidades.map((incapacidad, index) => {
              const isVencida = !!incapacidad.alerta;
              const isActiva = !isVencida && incapacidad.diasRestantes !== null;
              const isFutura = incapacidad.futura;

              return (
                <motion.div
                  key={index}
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
                  {/* 🔥 EFECTO HOLOGRÁFICO */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br opacity-10 hover:opacity-40 transition-all duration-500 
                      ${
                        isVencida
                          ? "from-red-500/40"
                          : isFutura
                          ? "from-blue-500/40"
                          : "from-cyan-500/40"
                      }`}
                  ></div>

                  {/* 🏥 Nombre del paciente */}
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

                  {/* 💳 Nómina */}
                  <h2 className="text-xl text-gray-300 flex items-center gap-2 mt-2">
                    <FaIdCard className="text-yellow-400" /> Nómina:{" "}
                    {incapacidad.nomina}
                  </h2>

                  {/* 📅 Fechas */}
                  <p className="text-gray-300 text-md flex items-center gap-2 mt-3">
                    <FaCalendarAlt className="text-yellow-400" /> <b>Inicio:</b>{" "}
                    {incapacidad.fechainicio}
                  </p>
                  <p className="text-gray-300 text-md flex items-center gap-2">
                    <FaClock className="text-red-400" /> <b>Fin:</b>{" "}
                    {incapacidad.fechafin}
                  </p>

                  {/* 📝 Observaciones */}
                  <p className="text-gray-300 text-md flex items-center gap-2 mt-3">
                    <FaNotesMedical className="text-green-400" />{" "}
                    <b>Observaciones:</b> {incapacidad.observaciones || "N/A"}
                  </p>

                  {/* 🔬 Médico y Especialidad */}
                  <div className="mt-4 text-md text-gray-400 border-t border-gray-500/50 pt-3">
                    <p className="flex items-center gap-2">
                      <FaUserMd className="text-blue-400" /> <b>Médico:</b>{" "}
                      {incapacidad.clavemedico_nombre || "Desconocido"}
                    </p>
                    <p className="flex items-center gap-2">
                      🏥 <b>Especialidad:</b>{" "}
                      {incapacidad.especialidad_clavemedico || "N/A"}
                    </p>
                  </div>

                  {/* ⚠️ ALERTAS (Más transparencia y desenfoque) */}
                  {isVencida && (
                    <motion.div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600/40 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-xl">
                      <FaExclamationTriangle className="text-lg" />
                      <span>
                        Incapacidad vencida hace {incapacidad.alerta}
                      </span>
                    </motion.div>
                  )}
                  {isFutura && (
                    <motion.div className="absolute top-3 right-3 flex items-center gap-2 bg-blue-600/40 text-white text-xs px-3 py-2 rounded-full shadow-lg backdrop-blur-xl">
                      <FaHourglassStart className="text-lg" />
                      <span>Aún no inicia</span>
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
