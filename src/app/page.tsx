/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const Home = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMouseEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col items-center py-10">
      <header className="flex items-center mb-8">
        <Image
          src="/heraldica.png"
          alt="App Icon"
          width={200}
          height={200}
          className="mr-4 shadow-md transform transition-transform duration-300 hover:scale-105"
        />
        <h1 className="text-4xl font-bold shadow-md transform transition-transform duration-300 hover:scale-105">
          Servicio Médico SJR
        </h1>
      </header>

      {/* Contenedor responsivo para botones */}
      <div className="flex flex-col md:flex-row justify-center space-x-0 md:space-x-4 space-y-4 md:space-y-0 w-full max-w-md mx-auto">
        <SidebarButton
          title="Consultas"
          options={["Signos Vitales", "Diagnostico", "Recetas"]}
          isOpen={openMenu === "Consultas"}
          handleMouseEnter={() => handleMouseEnter("Consultas")}
          handleMouseLeave={handleMouseLeave}
        />
        <SidebarButton
          title="Catálogos"
          options={[
            "Beneficiarios",
            "Especialidades",
            "Medicamentos",
            "Enfermedades Crónicas",
            "Usuarios",
            "Proveedores",
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
        <button className="bg-red-600 p-4 rounded-lg shadow-md hover:bg-red-500 transition text-center mt-4 md:mt-0 w-full md:w-auto transform transition-transform duration-300 hover:scale-105 border-2 border-red-700">
          Salir
        </button>
      </div>
    </div>
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
      className="relative"
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
