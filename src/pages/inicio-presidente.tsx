/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import NotificationBell from "@/components/NotificationBell";

const InicioPresidente = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    const user = Cookies.get("nombreusuario") || "Presidente";
    setUsername(user);

    //! Prefetch de las rutas con control de errores
    statisticsCards.forEach((card) => {
      try {
        router.prefetch(card.path);
      } catch (error) {
        console.error(`Error prefetching route ${card.path}:`, error);
      }
    });
  }, []);

  const navigateTo = async (path: string) => {
    try {
      setLoadingPath(path); //* Establece el estado de carga
      router.replace(path); //* Navega a la ruta
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
    } finally {
      setLoadingPath(null); //! Resetea el estado de carga
    }
  };

  const statisticsCards = [
    {
      title: "Intervalos de Consultas Generales",
      image: "/grafica-azul.png",
      path: "/estadisticas/intervalos-de-consultas",
      gradient: "from-teal-500 to-teal-900",
    },
    {
      title: "Análisis de Costos de Surtimientos",
      image: "/grafica-morada.png",
      path: "/estadisticas/costo-de-surtimientos",
      gradient: "from-purple-500 to-purple-900",
    },
    {
      title: "Intervalos de Consultas por Especialidad",
      image: "/grafica-rosa.png",
      path: "/estadisticas/intervalo-de-especialidades",
      gradient: "from-pink-500 to-pink-900",
    },
    {
      title: "Total de Pacientes por Especialidad",
      image: "/grafica-naranja.png",
      path: "/estadisticas/total-de-pacientes-por-especialidad",
      gradient: "from-orange-500 to-orange-900",
    },
    {
      title: "Incapacidades de Pacientes",
      image: "/grafica-azul.png",
      path: "/estadisticas/incapacidades-de-pacientes",
      gradient: "from-orange-500 to-orange-900",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {/* Header */}
      <header className="p-8 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 shadow-md rounded-b-3xl">
        <h1 className="text-6xl font-extrabold text-blue-400 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 p-4 rounded-xl shadow-lg">
          Bienvenido {username}
        </h1>

      {/* Campana flotante */}
      <div className="absolute top-5 right-5 z-20">
        <NotificationBell />
      </div>

        <p className="text-gray-400 text-2xl mt-4">
          Aquí están tus estadísticas y accesos rápidos
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {statisticsCards.map((card, index) => (
            <div key={index} className="relative group">
              {/* Main Card */}
              <div
                className={`relative p-12 h-[30rem] rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-200 cursor-pointer bg-gradient-to-br ${card.gradient}`}
                style={{
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onClick={() => navigateTo(card.path)}
              >
                {/* Fondo oscuro translúcido */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Indicador de carga */}
                {loadingPath === card.path && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-3xl">
                    <p className="text-white text-lg">Cargando...</p>
                  </div>
                )}

                {/* Texto dinámico en hover */}
                <div className="absolute inset-0 flex items-center justify-center text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-2xl font-bold">
                    De clic aquí para ver la gráfica
                  </p>
                </div>

                {/* Borde de neón */}
                <div
                  className={`absolute inset-0 rounded-3xl border-4 border-transparent transition-all duration-300 pointer-events-none ${
                    card.gradient.includes("teal")
                      ? "group-hover:border-teal-400 group-hover:shadow-[0_0_30px_10px_rgba(56,178,172,1)]"
                      : card.gradient.includes("purple")
                      ? "group-hover:border-purple-400 group-hover:shadow-[0_0_30px_10px_rgba(139,92,246,1)]"
                      : card.gradient.includes("pink")
                      ? "group-hover:border-pink-400 group-hover:shadow-[0_0_30px_10px_rgba(236,72,153,1)]"
                      : "group-hover:border-orange-400 group-hover:shadow-[0_0_30px_10px_rgba(249,115,22,1)]"
                  }`}
                ></div>

                {/* Título Fijo en la Parte Inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 rounded-b-3xl">
                  <h3
                    className={`text-lg font-bold text-center text-white transition-all duration-300 ${
                      card.gradient.includes("teal")
                        ? "group-hover:text-teal-400"
                        : card.gradient.includes("purple")
                        ? "group-hover:text-purple-400"
                        : card.gradient.includes("pink")
                        ? "group-hover:text-pink-400"
                        : "group-hover:text-orange-400"
                    }`}
                  >
                    {card.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InicioPresidente;
