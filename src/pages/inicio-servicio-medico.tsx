"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Authguard from '../components/AuthGuard';
import Cookies from 'js-cookie';


const Home = () => {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMouseEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  // Función para manejar el logout
  const handleLogout = () => {
    Cookies.remove('token'); // Elimina la cookie de autenticación
    Cookies.remove('rol');   // Opcional: elimina la cookie de rol si la usas
    router.push('/');   // Redirige al usuario a la página de login
  };


  return (
    <Authguard >
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white flex flex-col items-center pt-10">
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

      {/* Main content */}
      <div className="flex flex-col md:flex-row justify-center space-x-0 md:space-x-4 space-y-4 md:space-y-0 w-full max-w-2xl mx-auto mt-8">
        <SidebarButton
          title="Consultas"
          options={["Signos Vitales", "Diagnostico", "Recetas"]}
          isOpen={openMenu === "Consultas"}
          handleMouseEnter={() => handleMouseEnter("Consultas")}
          handleMouseLeave={handleMouseLeave}
        />
        <SidebarButton
          title="Catalogos"
          options={[
            "Beneficiarios",
            "Especialidades",
            "Medicamentos",
            "Enfermedades Crónicas",
            "usuarios-y-Proveedores",
          ]}
          isOpen={openMenu === "Catálogos"}
          handleMouseEnter={() => handleMouseEnter("Catálogos")}
          handleMouseLeave={handleMouseLeave}
        />
        <SidebarButton
          title="Capturas"
          options={[
            "Pase a Especialidad",
            "Surtimientos",
            "Orden de Estudio de Laboratorio",
            "Incapacidades",
            "Gastos",
          ]}
          isOpen={openMenu === "Capturas"}
          handleMouseEnter={() => handleMouseEnter("Capturas")}
          handleMouseLeave={handleMouseLeave}
        />
        <SidebarButton
          title="Cancelaciones"
          options={["Formatos"]}
          isOpen={openMenu === "Cancelaciones"}
          handleMouseEnter={() => handleMouseEnter("Cancelaciones")}
          handleMouseLeave={handleMouseLeave}
        />
        <SidebarButton
          title="Reportes"
          options={["Incapacidades", "Costos"]}
          isOpen={openMenu === "Reportes"}
          handleMouseEnter={() => handleMouseEnter("Reportes")}
          handleMouseLeave={handleMouseLeave}
        />
        <button
            onClick={handleLogout} // Botón para cerrar sesión
            className="bg-red-600 p-4 rounded-lg shadow-md hover:bg-red-500 transition text-center mt-4 md:mt-0 w-full md:w-auto transform transition-transform duration-300 hover:scale-105 border-2 border-red-700"
          >
            Cerrar sesión
          </button>
      </div>
    </div>
    </Authguard >
  );
};

interface SidebarButtonProps {
  title: string;
  options: string[];
  isOpen: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  title,
  options,
  isOpen,
  handleMouseEnter,
  handleMouseLeave,
}) => {
  return (
    <div
      className="relative w-full md:w-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition flex justify-between items-center w-full md:w-48 transform transition-transform duration-300 hover:scale-105 border-2 border-gray-600">
        <span className="text-sm font-semibold">{title}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 bg-gray-700 text-white rounded-lg shadow-lg w-full mt-1 z-10">
          {options.map((option, index) => (
            <Link
              key={index}
              href={`/${title.toLowerCase()}/${option
                .replace(/\s+/g, "-")
                .toLowerCase()}`}
              className="block px-6 py-2 text-sm hover:bg-gray-600 transition duration-150 ease-in-out rounded-lg"
            >
              {option}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
