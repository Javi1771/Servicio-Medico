/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  FaUserCheck,
  FaBookMedical,
  FaStethoscope,
  FaLaptopMedical,
  FaChartLine,
  FaMedkit,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { BiLogoReact } from "react-icons/bi";
import { MdLogout } from "react-icons/md";
import Cookies from "js-cookie";

// Carga dinámica del loader sin SSR
const LoaderGeneral = dynamic(
  () => import("../pages/estadisticas/Loaders/Loader-general"),
  { ssr: false }
);

interface PresidenteLayoutProps {
  children: ReactNode;
}

const PresidenteLayout: React.FC<PresidenteLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fromSidebar, setFromSidebar] = useState<boolean>(false); // Determina si el cambio es desde la barra lateral

  // Lista de rutas sin layout
  const noLayoutRoutes = [
    "/consultas/recetas/generar-receta-farmacia",
    "/consultas/recetas/generar-receta-paciente",
    "/capturas/recetas/generar-receta-paciente-pase",
    "/capturas/recetas/generar-receta-farmacia-pase",
    "/capturas/laboratorio/generar-ordenes",
    "/capturas/incapacidades/generar-incapacidad",
  ];

  // Para evitar renderizado en SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Efecto para manejar el cambio de ruta y la animación de carga
  useEffect(() => {
    const handleRouteChangeStart = () => {
      if (fromSidebar) setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsLoading(false);
      setFromSidebar(false);
      setMobileMenuOpen(false); // Cierra el menú móvil tras la navegación
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [fromSidebar, router.events]);

  // Función para cerrar sesión
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("rol");
    router.replace("/");
  };

  // Navega a una ruta, marcando el cambio como proveniente de la sidebar
  const navigateTo = (path: string) => {
    setFromSidebar(true);
    router.replace(path);
  };

  // Alterna la apertura/cierre de un menú (acordeón)
  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Opciones del menú lateral
  const menuOptions = [
    {
      title: "Consultas",
      icon: (
        <FaStethoscope className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [
        { name: "Signos Vitales", path: "/consultas/signos-vitales" },
        { name: "Diagnóstico", path: "/consultas/diagnostico" },
      ],
    },
    {
      title: "Especialista",
      icon: (
        <FaUserCheck className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [{ name: "Consulta Especialista", path: "/especialista/consulta-especialista" }],
    },
    {
      title: "Catálogos",
      icon: (
        <FaBookMedical className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [
        { name: "Beneficiarios", path: "/catalogos/beneficiarios" },
        { name: "Especialidades", path: "/catalogos/especialidades" },
        { name: "Enfermedades Crónicas", path: "/catalogos/enfermedades-cronicas" },
        { name: "Usuarios y Proveedores", path: "/catalogos/usuarios-y-proveedores" },
      ],
    },
    {
      title: "Capturas",
      icon: (
        <FaLaptopMedical className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [
        { name: "Pases a Especialidades", path: "/capturas/pases-a-especialidades" },
        { name: "Surtimientos", path: "/capturas/surtimientos" },
        { name: "Orden de Estudio de Laboratorio", path: "/capturas/orden-de-estudio-de-laboratorio" },
        { name: "Incapacidades", path: "/capturas/incapacidades" },
        { name: "Costos", path: "/capturas/costos" },
        { name: "Cancelaciones", path: "/capturas/cancelaciones" },
      ],
    },
    {
      title: "Reportes",
      icon: (
        <FaChartLine className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [{ name: "Incapacidades", path: "/reportes/incapacidades" }],
    },
    {
      title: "Farmacia",
      icon: (
        <FaMedkit className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [
        { name: "Medicamentos", path: "/farmacia/medicamentos" },
        { name: "Farmacia Medicamentos", path: "/farmacia/farmacia-surtimientos" },
        { name: "Alertas de Stock", path: "/farmacia/alertas-de-stock" },
        { name: "Unidades de Medida", path: "/farmacia/unidades-de-medida" },
        { name: "Recetas Pendientes", path: "/farmacia/recetas-pendientes" },
      ],
    },
    {
      title: "Dashboard",
      icon: (
        <BiLogoReact className="text-blue-400 text-3xl transition-transform duration-300 group-hover:scale-110" />
      ),
      options: [{ name: "Actividades", path: "/dashboard/actividades" }],
    },
  ];

  // Evitar renderizar el layout en SSR o para rutas que no lo requieren
  if (!isClient) return null;
  if (noLayoutRoutes.includes(router.pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header para mobile */}
      <header className="md:hidden flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-700 shadow-md">
        <h1
          className="text-xl font-extrabold text-blue-500 cursor-pointer"
          onClick={() => router.replace("/inicio-presidente")}
        >
          PANDORA Dashboard
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes className="text-3xl" /> : <FaBars className="text-3xl" />}
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar para desktop */}
        <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 p-6 shadow-2xl">
          <div className="text-center mb-10">
            <h1
              className="text-4xl font-extrabold text-blue-500 cursor-pointer"
              onClick={() => router.replace("/inicio-presidente")}
            >
              PANDORA Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-2">Servicio Médico</p>
          </div>
          <nav className="flex-1">
            <ul className="space-y-6">
              {menuOptions.map((menu, index) => (
                <li key={index}>
                  <div
                    className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 group"
                    onClick={() => toggleMenu(menu.title)}
                  >
                    {menu.icon}
                    <span className="text-lg font-bold transition-all duration-300 group-hover:text-blue-400">
                      {menu.title}
                    </span>
                  </div>
                  {openMenu === menu.title && (
                    <ul className="ml-6 mt-2 space-y-2">
                      {menu.options.map((option, idx) => (
                        <li
                          key={idx}
                          className="cursor-pointer px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-md shadow-md text-sm transition transform hover:scale-105 hover:bg-gray-500"
                          onClick={() => navigateTo(option.path)}
                        >
                          {option.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <button
            className="flex items-center space-x-4 p-4 mt-4 bg-gradient-to-r from-red-700 to-red-500 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 group hover:shadow-[0_0_25px_10px_rgba(245,56,85,0.8)]"
            onClick={handleLogout}
          >
            <MdLogout className="text-red-300 text-3xl transition-transform duration-300 group-hover:scale-110" />
            <span className="text-lg font-semibold">Cerrar Sesión</span>
          </button>
        </aside>

        {/* Sidebar para mobile */}
        {mobileMenuOpen && (
          <aside className="md:hidden fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 p-6 z-50 shadow-2xl overflow-y-auto">
            <div className="text-center mb-10">
              <h1
                className="text-2xl font-extrabold text-blue-500 cursor-pointer"
                onClick={() => {
                  router.replace("/inicio-presidente");
                  setMobileMenuOpen(false);
                }}
              >
                PANDORA Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-2">Servicio Médico</p>
            </div>
            <nav className="flex-1">
              <ul className="space-y-4">
                {menuOptions.map((menu, index) => (
                  <li key={index}>
                    <div
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow cursor-pointer transition hover:bg-gray-600"
                      onClick={() => toggleMenu(menu.title)}
                    >
                      {menu.icon}
                      <span className="text-md font-bold">{menu.title}</span>
                    </div>
                    {openMenu === menu.title && (
                      <ul className="ml-4 mt-2 space-y-2">
                        {menu.options.map((option, idx) => (
                          <li
                            key={idx}
                            className="cursor-pointer px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded shadow text-sm transition hover:bg-gray-500"
                            onClick={() => navigateTo(option.path)}
                          >
                            {option.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <button
              className="flex items-center justify-center w-full p-3 mt-6 bg-gradient-to-r from-red-700 to-red-500 rounded-lg shadow cursor-pointer transition hover:bg-red-600"
              onClick={handleLogout}
            >
              <MdLogout className="text-red-300 text-3xl" />
              <span className="ml-2 text-md font-semibold">Cerrar Sesión</span>
            </button>
          </aside>
        )}

        {/* Contenido principal */}
        <main className="relative flex-1 p-6 w-full md:ml-80 mt-4 md:mt-0">
          {isLoading && fromSidebar && (
            <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
              <LoaderGeneral size={120} />
            </div>
          )}
          <div
            className={`transition-transform duration-300 ${
              isLoading ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PresidenteLayout;
