"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import Cookies from "js-cookie";
import NotificationBell from "@/components/NotificationBell";

import {
  FaStethoscope,
  FaUserMd,
  FaHeartbeat,
  FaBriefcaseMedical,
  FaCapsules,
  FaSignOutAlt,
  FaChevronDown,
  FaFeatherAlt,
} from "react-icons/fa";

import { FaLaptopMedical } from "react-icons/fa";
import { BsGraphUpArrow } from "react-icons/bs";

const Home = () => {
  const router = useRouter();
  const [rol, setRol] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingPath, setLoadingPath] = useState<string | null>(null); //* Indicador de carga

  useEffect(() => {
    const userRole = Cookies.get("rol") || null;
    setRol(userRole);

    if (userRole === "7") {
      router.replace("/inicio-presidente");
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
    router.replace("/");
  };

  const navigateTo = async (path: string) => {
    if (loadingPath) return; //! Bloquea navegación si ya hay una ruta cargando

    try {
      setLoadingPath(path); //* Activa el estado de carga
      await router.replace(path);
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
    } finally {
      setLoadingPath(null); //! Desactiva el estado de carga
    }
  };

  const getMenuOptions = () => {
    const menuOptions: {
      title: string;
      options: string[];
      icon: JSX.Element;
    }[] = [];

    //* Aquí añadimos íconos que representen cada sección de forma más visual
    if (rol === "6") {
      menuOptions.push(
        {
          title: "Consultas",
          options: ["Signos Vitales", "Diagnostico"],
          icon: <FaStethoscope className="inline-block mr-2" />,
        },
        {
          title: "Especialista",
          options: ["Consulta Especialista"],
          icon: <FaUserMd className="inline-block mr-2" />,
        },
        {
          title: "Catalogos",
          options: [
            "Beneficiarios",
            "Especialidades",
            "Enfermedades Cronicas",
            "Usuarios y Proveedores",
          ],
          icon: <FaBriefcaseMedical className="inline-block mr-2" />,
        },
        {
          title: "Capturas",
          options: [
            "Pases a Especialidades",
            "Surtimientos",
            "Orden de Estudio de Laboratorio",
            "Incapacidades",
            "Costos",
            "Cancelaciones",
          ],
          icon: <FaHeartbeat className="inline-block mr-2" />,
        },
        {
          title: "Reportes",
          options: ["Incapacidades", "Beneficiarios Activos", "Reportes OIC"], 
          icon: <FaFeatherAlt className="inline-block mr-2" />,
        },
        {
          title: "Farmacia",
          options: [
            "Medicamentos",
            "Farmacia Surtimientos",
            "Alertas de Stock",
            "Unidades de Medida",
            "Recetas Pendientes",
          ],
          icon: <FaCapsules className="inline-block mr-2" />,
        }
      );
    }

    if (rol === "1") {
      menuOptions.push(
        {
          title: "Consultas",
          options: ["Signos Vitales", "Diagnostico"],
          icon: <FaStethoscope className="inline-block mr-2" />,
        },
        {
          title: "Capturas",
          options: ["Orden de Estudio de Laboratorio"],
          icon: <FaHeartbeat className="inline-block mr-2" />,
        }
      );
    }

    if (rol === "2") {
      menuOptions.push({
        title: "Consultas",
        options: ["Signos Vitales"],
        icon: <FaStethoscope className="inline-block mr-2" />,
      });
    }

    if (rol === "3") {
      menuOptions.push({
        title: "Capturas",
        options: [
          "Pases a Especialidades",
          "Surtimientos",
          "Orden de Estudio de Laboratorio",
          "Incapacidades",
          "Costos",
          "Cancelaciones",
        ],
        icon: <FaHeartbeat className="inline-block mr-2" />,
      });
    }

    if (rol === "8") {
      menuOptions.push(
        {
          title: "Catalogos",
          options: ["Beneficiarios", "Historial Incapacidades Completo"],
          icon: <FaCapsules className="inline-block mr-2" />,
        },
        {
          title: "Reportes",
          options: ["Incapacidades", "Beneficiarios Activos"],
          icon: <FaFeatherAlt className="inline-block mr-2" />,
        }
      );
    }

    if (rol === "9") {
      menuOptions.push({
        title: "Farmacia",
        options: [
          "Medicamentos",
          "Farmacia Surtimientos",
          "Alertas de Stock",
          "Unidades de Medida",
          "Recetas Pendientes",
        ],
        icon: <FaCapsules className="inline-block mr-2" />,
      });
    }

    if (rol === "10") {
      menuOptions.push(
        {
          title: "Consultas",
          options: ["Signos Vitales", "Diagnostico"],
          icon: <FaStethoscope className="inline-block mr-2" />,
        },
        {
          title: "Capturas",
          options: [
            "Pases a Especialidades",
            "Surtimientos",
            "Orden de Estudio de Laboratorio",
            "Incapacidades",
            "Costos",
            "Cancelaciones",
          ],
          icon: <FaHeartbeat className="inline-block mr-2" />,
        },
        {
          title: "Farmacia",
          options: [
            "Medicamentos",
            "Farmacia Surtimientos",
            "Alertas de Stock",
            "Unidades de Medida",
            "Recetas Pendientes",
          ],
          icon: <FaCapsules className="inline-block mr-2" />,
        },
        {
          title: "Catalogos",
          options: [
            "Usuarios y Proveedores",
            "Estudios",
            "Enfermedades Cronicas",
            "Especialidades",
            "Beneficiarios",
            "Historial Incapacidades Completo",
          ],
          icon: <FaBriefcaseMedical className="inline-block mr-2" />,
        },
        {
          title: "Estadisticas",
          options: [
            "Costo de Surtimientos",
            "Intervalo de Especialidades",
            "Intervalos de Consultas",
            "Total de Pacientes por Especialidad",
          ],
          icon: <BsGraphUpArrow className="inline-block mr-2" />,
        },
        {
          title: "Reportes",
          options: ["Incapacidades", "Beneficiarios Activos", "Reportes OIC"], 
          icon: <BsGraphUpArrow className="inline-block mr-2" />,
        },
        {
          title: "Dashboard",
          options: ["Actividades"],
          icon: <FaLaptopMedical className="inline-block mr-2" />,
        }
      );
    }

    if (rol === "11") {
      menuOptions.push(
        {
          title: "Especialista",
          options: ["Consulta Especialista"],
          icon: <FaUserMd className="inline-block mr-2" />,
        },
        {
          title: "Capturas",
          options: ["Orden de Estudio de Laboratorio"],
          icon: <FaHeartbeat className="inline-block mr-2" />,
        }
      );
    }

    return menuOptions;
  };

  const menuOptions = getMenuOptions();

  return (
    <AuthGuard>
      {/* Fondo principal con degradado, efecto neón y estrellas simulando un tema futurista */}
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-black to-gray-900 text-white flex flex-col items-center relative overflow-hidden">
        {/* Efecto "partículas" o "estrellas" en el fondo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Puedes jugar con la opacidad y el número de partículas */}
          {/* <div className="absolute w-full h-full bg-[url('/stars.png')] bg-repeat opacity-40"></div> */}
        </div>

        {/* Contenedor interno con margen superior */}
        <div className="relative w-full flex flex-col items-center pt-10 pb-10 z-10">
          {/* Header/Banner */}
          <div className="relative w-full h-48 sm:h-60 md:h-80 lg:h-96 overflow-hidden rounded-md shadow-md mb-6">
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 border-4 border-cyan-400 rounded-full overflow-hidden transform transition-transform duration-300 hover:scale-105 shadow-[0_0_15px_5px_rgba(0,255,255,0.7)]">
                  <Image
                    src="/logo_sjr.png"
                    alt="Logo"
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-cyan-300 tracking-wide whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                  Servicio Médico SJR
                </h1>

                {/* Campana flotante */}
                <div className="absolute top-5 right-5 z-20">
                  <NotificationBell />
                </div>
              </div>
            </div>
          </div>

          {/* Menú de opciones */}
          <div className="flex flex-col md:flex-row justify-center md:space-x-4 space-y-4 md:space-y-0 w-full max-w-5xl px-4">
            {menuOptions.map((menu, index) => (
              <SidebarButton
                key={index}
                title={menu.title}
                options={menu.options}
                icon={menu.icon}
                isOpen={openMenu === menu.title}
                handleMouseEnter={() => handleMouseEnter(menu.title)}
                handleMouseLeave={handleMouseLeave}
                navigateTo={navigateTo}
                loadingPath={loadingPath}
              />
            ))}

            {/* Botón de Salir */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center bg-gradient-to-r from-red-600 to-pink-600 px-6 py-3 rounded-lg shadow-lg hover:brightness-125 transition-transform transform hover:scale-105 border-2 border-pink-500 font-semibold space-x-2"
            >
              <FaSignOutAlt className="text-lg" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

interface SidebarButtonProps {
  title: string;
  options: string[];
  icon?: JSX.Element;
  isOpen: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  navigateTo: (path: string) => void;
  loadingPath: string | null;
}

//* Botón que incluye menú desplegable
const SidebarButton: React.FC<SidebarButtonProps> = ({
  title,
  options,
  icon,
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
      {/* Botón principal */}
      <button className="flex items-center justify-between bg-gradient-to-br from-cyan-700 via-cyan-800 to-cyan-900 text-white px-4 py-3 rounded-lg shadow-lg hover:brightness-125 w-full md:w-56 transform transition-transform duration-300 hover:scale-105 border border-cyan-500">
        <span className="flex items-center font-semibold text-sm">
          {icon} {title}
        </span>
        <FaChevronDown
          className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute left-0 bg-cyan-900 bg-opacity-90 text-white rounded-lg shadow-xl w-full mt-1 z-20 p-2 animate-fadeIn">
          {options.map((option, index) => {
            const path = `/${title.toLowerCase()}/${option
              .replace(/\s+/g, "-")
              .toLowerCase()}`;
            const isLoading = loadingPath === path;

            return (
              <button
                key={index}
                onClick={() => navigateTo(path)}
                className={`block w-full text-left px-4 py-3 text-sm rounded-md transition-all duration-150 ease-in-out mb-1 
                ${
                  isLoading
                    ? "bg-gray-500 cursor-wait"
                    : "hover:bg-cyan-700 hover:shadow-md"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
