/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  FaUserCheck,
  FaBookMedical,
  FaStethoscope,
  FaBan,
  FaLaptopMedical,
  FaChartLine,
  FaMedkit,
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import Cookies from "js-cookie";

//* Dinámicamente importa el loader
const LoaderGeneral = dynamic(
  () => import("../pages/estadisticas/Loaders/Loader-general"),
  {
    ssr: false,
  }
);

interface PresidenteLayoutProps {
  children: ReactNode;
}

const PresidenteLayout: React.FC<PresidenteLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  
  useEffect(() => {
    setIsClient(true);
  }, []); 

  const noLayoutRoutes = [
    "/consultas/recetas/generar-receta-farmacia",
    "/consultas/recetas/generar-receta-paciente",
    "/consultas/recetas/generar-receta-farmacia-pase",
    "/consultas/recetas/generar-receta-paciente-pase",
  ];
  

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fromSidebar, setFromSidebar] = useState(false); //* Determina si el cambio es desde el menú lateral

  useEffect(() => {
    const handleRouteChangeStart = () => {
      console.log("Route change started");
      if (fromSidebar) setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      console.log("Route change completed");
      setIsLoading(false);
      setFromSidebar(false);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [fromSidebar, router.events]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("rol");
    router.replace("/");
  };

  const navigateTo = (path: string) => {
    setFromSidebar(true); //* Marcar como navegación desde la barra lateral
    router.replace(path);
  };

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const menuOptions = [
    {
      title: "Consultas",
      icon: (
        <FaStethoscope className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        { name: "Signos Vitales", path: "/consultas/signos-vitales" },
        { name: "Diagnóstico", path: "/consultas/diagnostico" },
      ],
    },
    {
      title: "Especialista",
      icon: (
        <FaUserCheck className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        {
          name: "Consulta Especialista",
          path: "/especialista/consulta-especialista",
        },
      ],
    },
    {
      title: "Catálogos",
      icon: (
        <FaBookMedical className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        { name: "Beneficiarios", path: "/catalogos/beneficiarios" },
        { name: "Especialidades", path: "/catalogos/especialidades" },
        { name: "Medicamentos", path: "/catalogos/medicamentos" },
        {
          name: "Enfermedades Crónicas",
          path: "/catalogos/enfermedades-cronicas",
        },
        {
          name: "Usuarios y Proveedores",
          path: "/catalogos/usuarios-y-proveedores",
        },
      ],
    },
    {
      title: "Capturas",
      icon: (
        <FaLaptopMedical className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        {
          name: "Pases a Especialidades",
          path: "/capturas/pases-a-especialidades",
        },
        { name: "Surtimientos", path: "/capturas/surtimientos" },
        { name: "Surtimientos2", path: "/capturas/surtimientos2" },
        {
          name: "Orden de Estudio de Laboratorio",
          path: "/capturas/orden-estudio-laboratorio",
        },
        { name: "Incapacidades", path: "/capturas/incapacidades" },
        { name: "Gastos", path: "/capturas/gastos" },
      ],
    },
    {
      title: "Cancelaciones",
      icon: (
        <FaBan className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [{ name: "Formatos", path: "/cancelaciones/formatos" }],
    },
    {
      title: "Reportes",
      icon: (
        <FaChartLine className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        { name: "Incapacidades", path: "/reportes/incapacidades" },
        { name: "Costos", path: "/reportes/costos" },
      ],
    },
    {
      title: "Farmacia",
      icon: (
        <FaMedkit className="text-blue-400 text-3xl group-hover:scale-110 transition-transform duration-300" />
      ),
      options: [
        { name: "Medicamentos", path: "/farmacia/medicamentos" },
        { name: "Farmacia Medicamentos", path: "/farmacia/farmacia-surtimientos" },
        { name: "Notificaciones", path: "/farmacia/notificaciones" },
      ],
    },
  ]; 

  if (!isClient) {
    return null; //! Evita renderizar en SSR
  }
  
  if (noLayoutRoutes.includes(router.pathname)) {
    return <>{children}</>;
  }  

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 p-6 shadow-2xl flex flex-col">
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-extrabold text-blue-500 glow cursor-pointer"
            onClick={() => router.replace("/inicio-presidente")}
          >
            S.M. Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-2">Servicio Médico</p>
        </div>
        <nav className="flex-1">
          <ul className="space-y-6">
            {menuOptions.map((menu, index) => (
              <li key={index}>
                <div
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow-lg cursor-pointer hover:scale-105 hover:shadow-[0_0_25px_10px_rgba(59,130,246,0.8)] transform transition-all duration-300 group"
                  onClick={() => toggleMenu(menu.title)}
                >
                  {menu.icon}
                  <span className="text-lg font-bold group-hover:text-blue-400 transition-all duration-300">
                    {menu.title}
                  </span>
                </div>
                {openMenu === menu.title && (
                  <ul className="ml-6 mt-2 space-y-2">
                    {menu.options.map((option, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-md shadow-md hover:scale-105 transform transition hover:bg-gray-500 text-white text-sm"
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
          className="flex items-center space-x-4 p-4 mt-4 bg-gradient-to-r from-red-700 to-red-500 rounded-lg shadow-lg cursor-pointer hover:scale-105 hover:shadow-[0_0_25px_10px_rgba(245,56,85,0.8)] transform transition-all duration-300 group"
          onClick={handleLogout}
        >
          <MdLogout className="text-red-300 text-3xl group-hover:scale-110 transition-transform duration-300" />
          <span className="text-lg font-semibold">Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="relative flex-1 p-12 ml-80">
        {isLoading && fromSidebar && (
          <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <LoaderGeneral size={120} />
            </div>
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
  );
};

export default PresidenteLayout;
