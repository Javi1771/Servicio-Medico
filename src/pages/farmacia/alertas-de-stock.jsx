/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link"; 
import { motion } from "framer-motion";

//* Importamos íconos desde diferentes librerías para mayor variedad
import {
  BiArrowBack,
  BiBarcodeReader,
  BiBox,
  BiPackage,
  BiArrowFromBottom,
  BiArrowToTop,
  BiErrorCircle,
  BiCheckCircle,
} from "react-icons/bi";
import { GiMedicines } from "react-icons/gi";
import { FaRegStopCircle } from "react-icons/fa";

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

  //* Función para elegir el ícono principal según el stockStatus y asignarle color
  const getStatusIcon = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo")
      return <BiErrorCircle className="text-3xl text-red-500" aria-label="Stock bajo" />;
    if (lowerStatus === "stock medio")
      return <FaRegStopCircle className="text-3xl text-orange-500" aria-label="Stock medio" />;
    //! Default
    return <BiCheckCircle className="text-3xl text-cyan-500" aria-label="Stock alto" />;
  };

  //* Función para determinar estilos de la tarjeta según el stockStatus
  const getCardStyle = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo") {
      return "bg-gradient-to-br from-black to-red-900 border-red-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(255,0,0,1)]";
    } else if (lowerStatus === "stock medio") {
      return "bg-gradient-to-br from-black to-orange-900 border-orange-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(255,140,0,1)]";
    }
    //! Default (stock alto u otro)
    return "bg-gradient-to-br from-black to-cyan-900 border-cyan-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(0,255,255,1)]";
  };

  //* Función para asignar color al número de piezas, títulos y otros íconos según el estado
  const getColorByStatus = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo") return "text-red-500";
    if (lowerStatus === "stock medio") return "text-orange-500";
    return "text-white";
  };

  //* Función para asignar sombra de iluminación al número de piezas y al icono de la caja
  const getIlluminationShadow = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo")
      return "drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]";
    if (lowerStatus === "stock medio")
      return "drop-shadow-[0_0_25px_rgba(255,140,0,0.8)]";
    return "drop-shadow-[0_0_25px_rgba(0,255,255,0.8)]";
  };

  //* Memoizamos los estilos para evitar cálculos innecesarios en cada render
  const memoizedStyles = useMemo(() => ({
    getStatusIcon,
    getCardStyle,
    getColorByStatus,
    getIlluminationShadow,
  }), []);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0 bg-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {/* Botón de regresar */}
      <div className="relative z-10 mb-8">
        <Link href="/inicio-servicio-medico">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white font-bold rounded-xl shadow-[0_0_20px_#0ff] hover:bg-teal-500 transition-transform hover:scale-105"
            aria-label="Regresar"
          >
            <BiArrowBack className="text-xl" />
            Regresar
          </button>
        </Link>
      </div>

      {/* Título estilo neón */}
      <motion.h1
        className="relative z-10 text-6xl font-extrabold text-center mb-10 uppercase tracking-widest"
        style={{ textShadow: "0 0 20px #0ff" }}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        📦 Alertas de Stock 📦
      </motion.h1>

      {/* Mensajes de carga o error */}
      {loading && (
        <p className="relative z-10 text-center text-2xl animate-pulse text-cyan-400">
          Cargando notificaciones...
        </p>
      )}
      {error && (
        <p className="relative z-10 text-center text-red-500 text-xl">{error}</p>
      )}

      {/* Grid de tarjetas */}
      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-6">
          {notificaciones.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              No hay notificaciones. 
            </p>
          ) : (
            notificaciones.map((item, index) => {
              //* Determinamos los estilos, íconos y colores según el estado
              const cardStyle = getCardStyle(item.stockStatus);
              const statusIcon = getStatusIcon(item.stockStatus);
              const dynamicColor = getColorByStatus(item.stockStatus);
              const illuminationShadow = getIlluminationShadow(item.stockStatus);

              return (
                <motion.div
                  key={item.id}
                  className={`relative rounded-3xl p-4 border-4 ${cardStyle} transition-all duration-500 overflow-hidden backdrop-blur-md`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.06 }}
                >
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-center gap-3 mb-4">
                    <GiMedicines className={`text-3xl ${dynamicColor}`} aria-hidden="true" />
                    <h2
                      className={`text-3xl font-extrabold tracking-wide ${dynamicColor}`}
                      style={{ textShadow: `0 0 15px currentColor` }}
                    >
                      {item.medicamento}
                    </h2>
                  </div>

                  {/* Ícono de estado + Texto */}
                  <div className="flex items-center gap-2 text-xl text-gray-300 mb-3">
                    {statusIcon}
                    <span className="uppercase font-bold">
                      {item.stockStatus}
                    </span>
                  </div>

                  {/* EAN */}
                  <div className="flex items-center gap-2 text-lg text-gray-300 mb-2">
                    <BiBarcodeReader className={`text-2xl ${dynamicColor}`} aria-hidden="true" />
                    <span className="font-semibold">EAN:</span>
                    <span>{item.ean}</span>
                  </div>

                  {/* Presentación */}
                  <div className="flex items-center gap-2 text-lg text-gray-300 mb-4">
                    <BiPackage className={`text-2xl ${dynamicColor}`} aria-hidden="true" />
                    <span className="font-semibold">Presentación:</span>
                    <span>
                      {item.presentacion}
                      {item.medida ? ` ${item.medida}` : ""}
                    </span>
                  </div>

                  {/* Sección central: Piezas y rango */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4">
                      <BiBox
                        className={`text-7xl ${dynamicColor} ${illuminationShadow}`}
                        aria-hidden="true"
                      />
                      {/* Número de piezas con color e iluminación según stock */}
                      <motion.span
                        className={`text-6xl font-extrabold ${dynamicColor} ${illuminationShadow}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {item.piezas}
                      </motion.span>
                    </div>
                    <div className="flex gap-6 text-lg text-gray-200 mt-5">
                      <div className="flex items-center gap-2">
                        <BiArrowFromBottom className={`text-2xl ${dynamicColor}`} aria-hidden="true" />
                        <span className="font-semibold">
                          Mín: {item.minimo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BiArrowToTop className={`text-2xl ${dynamicColor}`} aria-hidden="true" />
                        <span className="font-semibold">
                          Máx: {item.maximo}
                        </span>
                      </div>
                    </div>
                  </div>
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
