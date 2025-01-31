"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import Cookies from "js-cookie";

const Home = () => {
  const router = useRouter();
  const [rol, setRol] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingPath, setLoadingPath] = useState<string | null>(null); //* Indicador de carga

  useEffect(() => {
    const userRole = Cookies.get("rol") || null;
    setRol(userRole);

    if (userRole === "7") {
      router.push("/inicio-presidente");
    }
  }, [router]);

  const handleMouseEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("rol");
    router.push("/");
  };

  const navigateTo = async (path: string) => {
    if (loadingPath) return; //! Bloquea navegación si ya hay una ruta cargando

    try {
      setLoadingPath(path); //* Activa el estado de carga
      await router.push(path);
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
    } finally {
      setLoadingPath(null); //! Desactiva el estado de carga
    }
  };

  const getMenuOptions = () => {
    const menuOptions: { title: string; options: string[] }[] = [];

    if (rol === "6") {
      menuOptions.push(
        { title: "Consultas", options: ["Signos Vitales", "Diagnostico"] },
        { title: "Especialista", options: ["Consulta Especialista"] },
        {
          title: "Catalogos",
          options: [
            "Beneficiarios",
            "Especialidades",
            "Medicamentos",
            "Enfermedades Cronicas",
            "Usuarios y Proveedores",
          ],
        },
        {
          title: "Capturas",
          options: [
            "Pases a Especialidades",
            "Surtimientos2",
            "Orden de Estudio de Laboratorio",
            "Incapacidades",
            "Gastos",
          ],
        },
        { title: "Cancelaciones", options: ["Formatos"] },
        { title: "Reportes", options: ["Incapacidades", "Costos"] },
        { title: "Farmacia", options: ["Medicamentos"] }
      );
    }

    if (rol === "1") {
      menuOptions.push(
        { title: "Consultas", options: ["Signos Vitales", "Diagnostico"] },
        { title: "Especialista", options: ["Consulta Especialista"] }
      );
    }

    if (rol === "2") {
      menuOptions.push({ title: "Consultas", options: ["Signos Vitales"] });
    }

    if (rol === "3") {
      menuOptions.push({
        title: "Capturas",
        options: [
          "Pases a Especialidades",
          "Surtimientos",
          "Orden de Estudio de Laboratorio",
          "Incapacidades",
          "Gastos",
        ],
      });
    }

    return menuOptions;
  };

  const menuOptions = getMenuOptions();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white flex flex-col items-center pt-10">
        {/* Header */}
        <div className="relative w-full h-48 sm:h-60 md:h-80 lg:h-96 overflow-hidden">
          <Image
            src="/baner_sjr.png"
            alt="Banner"
            layout="fill"
            objectFit="cover"
            className="opacity-50"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center space-x-6 p-4">
            <div className="flex items-center space-x-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 border-4 border-white rounded-full overflow-hidden transform transition-transform duration-300 hover:scale-105">
                <Image
                  src="/logo_sjr.png"
                  alt="Logo"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-wide whitespace-nowrap">
                Servicio Médico SJR
              </h1>
            </div>
          </div>
        </div>

        {/* Opciones del Menú */}
        <div className="flex flex-col md:flex-row justify-center space-x-0 md:space-x-4 space-y-4 md:space-y-0 w-full max-w-2xl mx-auto mt-8">
          {menuOptions.map((menu, index) => (
            <SidebarButton
              key={index}
              title={menu.title}
              options={menu.options}
              isOpen={openMenu === menu.title}
              handleMouseEnter={() => handleMouseEnter(menu.title)}
              handleMouseLeave={handleMouseLeave}
              navigateTo={navigateTo}
              loadingPath={loadingPath}
            />
          ))}
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-700 p-4 rounded-lg shadow-md hover:from-red-600 hover:to-red-800 transition text-center mt-4 md:mt-0 w-full md:w-auto transform transition-transform duration-300 hover:scale-105 border-2 border-red-800 font-semibold"
          >
            Salir
          </button>
        </div>
      </div>
    </AuthGuard>
  );
};

interface SidebarButtonProps {
  title: string;
  options: string[];
  isOpen: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  navigateTo: (path: string) => void;
  loadingPath: string | null;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  title,
  options,
  isOpen,
  handleMouseEnter,
  handleMouseLeave,
  navigateTo,
  loadingPath,
}) => {
  return (
    <div
      className="relative w-full md:w-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón del menú */}
      <button className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-white p-4 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 flex justify-between items-center w-full md:w-60 transform transition-transform duration-300 hover:scale-105 border-2 border-gray-600">
        <span className="text-sm font-semibold">{title}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute left-0 bg-gray-800 text-white rounded-lg shadow-lg w-full mt-1 z-10 p-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() =>
                navigateTo(`/${title.toLowerCase()}/${option.replace(/\s+/g, "-").toLowerCase()}`)
              }
              className={`block w-full text-left px-6 py-3 text-sm rounded-md hover:bg-blue-600 transition duration-150 ease-in-out ${
                loadingPath === `/${title.toLowerCase()}/${option.replace(/\s+/g, "-").toLowerCase()}`
                  ? "bg-gray-500 cursor-wait"
                  : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
