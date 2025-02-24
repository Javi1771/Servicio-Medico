import React, { useEffect, useState } from "react";
import Link from "next/link"; // Asumiendo que estás usando Next.js
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaMedkit,
  FaBarcode,
  FaBoxes,
  FaBalanceScaleLeft,
  FaBalanceScaleRight,
} from "react-icons/fa";

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const response = await fetch("/api/farmacia/notificaciones");
        if (!response.ok) {
          throw new Error("Error al obtener notificaciones de stock.");
        }
        const data = await response.json();
        setNotificaciones(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificaciones();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* Fondo animado similar al ejemplo */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {/* Botón de regresar */}
      <div className="relative z-10 mb-6">
        <Link href="/inicio-servicio-medico">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white font-bold rounded-lg 
                       shadow-[0_0_15px_#0ff] hover:bg-teal-500 hover:text-gray-900 
                       transition-transform hover:scale-105"
          >
            <FaArrowLeft /> Regresar
          </button>
        </Link>
      </div>

      {/* Título neon */}
      <motion.h1
        className="relative z-10 text-5xl font-extrabold text-center mb-6 neon-text uppercase"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Notificaciones de Stock
      </motion.h1>

      {/* Mensajes de carga o error */}
      {loading && (
        <p className="relative z-10 text-center text-lg animate-pulse text-cyan-400">
          Cargando notificaciones...
        </p>
      )}
      {error && (
        <p className="relative z-10 text-red-500 text-center">{error}</p>
      )}

      {/* Grid de tarjetas */}
      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          {notificaciones.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              No hay notificaciones.
            </p>
          ) : (
            notificaciones.map((item, index) => {
              // Determinamos si está en 'stock bajo' o 'stock medio' (según tu endpoint)
              // Si tu endpoint pudiera devolver 'stock alto', puedes adaptarlo.
              const isBajo = item.stockStatus.toLowerCase() === "stock bajo";
              const isMedio = item.stockStatus.toLowerCase() === "stock medio";
              // Colores de la tarjeta en función del estado:
              const cardStyle = isBajo
                ? "bg-red-900/70 border border-red-600 hover:shadow-[0_0_30px_10px_rgba(255,0,0,0.6)]"
                : isMedio
                ? "bg-orange-900/70 border border-orange-600 hover:shadow-[0_0_30px_10px_rgba(255,140,0,0.6)]"
                : "bg-gray-800/70 border border-cyan-600 hover:shadow-[0_0_30px_10px_rgba(0,255,255,0.6)]";

              return (
                <motion.div
                  key={item.id}
                  className={`relative rounded-2xl p-6 shadow-lg transition-all duration-300 overflow-hidden backdrop-blur-lg ${cardStyle}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-center gap-2 mb-4">
                    <FaMedkit className="text-2xl text-yellow-300" />
                    <h2
                      className={`text-2xl font-bold ${
                        isBajo
                          ? "text-red-300"
                          : isMedio
                          ? "text-orange-300"
                          : "text-cyan-300"
                      }`}
                    >
                      {item.medicamento}
                    </h2>
                  </div>

                  {/* Información del medicamento */}
                  <p className="text-gray-300 flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-400" />
                    <span className="font-semibold">Estado:</span>{" "}
                    {item.stockStatus.toUpperCase()}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2 mt-1">
                    <FaBarcode className="text-green-400" />
                    <span className="font-semibold">EAN:</span> {item.ean}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2 mt-1">
                    <FaBoxes className="text-blue-400" />
                    <span className="font-semibold">Piezas:</span> {item.piezas}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2 mt-1">
                    <FaBalanceScaleRight className="text-purple-400" />
                    <span className="font-semibold">Máximo:</span> {item.maximo}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2 mt-1">
                    <FaBalanceScaleLeft className="text-pink-400" />
                    <span className="font-semibold">Mínimo:</span> {item.minimo}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2 mt-1">
                    <span className="font-semibold">Presentación:</span>{" "}
                    {item.presentacion}{" "}
                    {item.medida ? `- ${item.medida}` : ""}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
