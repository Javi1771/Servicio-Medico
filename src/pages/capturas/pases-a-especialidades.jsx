/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaSearch,
  FaClipboardList,
  FaPlus,
  FaFileAlt,
  FaCalendarAlt,
  FaUserAlt,
  FaIdBadge,
  FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Función reutilizable para mostrar alertas
const showAlert = (type, title, message) => {
  const colors = {
    error: {
      icon: "❌",
      bgGradient: "linear-gradient(145deg, #4a0000, #220000)",
      borderColor: "red-600",
      shadowColor: "rgba(255,23,68,0.9)",
      buttonColor: "#ff1744",
    },
    success: {
      icon: "✅",
      bgGradient: "linear-gradient(145deg, #004d00, #002900)",
      borderColor: "green-600",
      shadowColor: "rgba(0,255,0,0.9)",
      buttonColor: "#00c853",
    },
    info: {
      icon: "ℹ️",
      bgGradient: "linear-gradient(145deg, #001a4a, #000022)",
      borderColor: "blue-600",
      shadowColor: "rgba(33,150,243,0.9)",
      buttonColor: "#1e88e5",
    },
  };

  const styles = colors[type] || colors.info;

  MySwal.fire({
    icon: "info",
    title: `<span style='color: #fff; font-weight: bold; font-size: 1.5em;'>${styles.icon} ${title}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: styles.bgGradient,
    confirmButtonColor: styles.buttonColor,
    confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup: `border border-${styles.borderColor} shadow-[0px_0px_20px_5px_${styles.shadowColor}] rounded-lg`,
    },
  });
};

const PasesAEspecialidad = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("nomina");
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch("/api/especialidades/pases-especialidad");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const data = await response.json();
      setDatos(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      showAlert(
        "error",
        "Error al cargar datos",
        "No se pudieron cargar los datos. Por favor, intenta nuevamente."
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado de datos
  const datosFiltrados = datos.filter((item) => {
    if (filtro === "nomina") {
      return item.nomina.toLowerCase().includes(busqueda.toLowerCase());
    } else if (filtro === "folio") {
      return item.folio.toString().includes(busqueda);
    }
    return true;
  });

  const handleRowClick = (folio) => {
    router.push(`/capturas/pases/crear-pase?claveconsulta=${folio}`);
  };

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-700 to-blue-700 p-8 text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white flex items-center justify-center gap-3">
          <FaClipboardList />
          Pases a Especialidad
        </h1>
        <button
          onClick={() => router.push("/capturas/pases/crear-pase-nuevo")}
          className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:brightness-125 transition-all duration-300"
        >
          <FaPlus className="inline-block mr-2" />
          Nuevo Pase
        </button>
      </header>

      {/* Filtro y buscador */}
      <section className="mb-12 px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Switch */}
          <div className="flex items-center gap-4">
            <span
              className={`text-lg font-semibold ${
                filtro === "nomina" ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              Nómina
            </span>
            <div
              className="relative w-20 h-10 bg-gray-800 rounded-full shadow-inner cursor-pointer flex items-center transition-all duration-300"
              onClick={() =>
                setFiltro((prev) => (prev === "nomina" ? "folio" : "nomina"))
              }
            >
              <div
                className={`absolute left-1 top-1 w-8 h-8 bg-gradient-to-r ${
                  filtro === "folio"
                    ? "from-pink-400 to-red-500"
                    : "from-cyan-400 to-blue-500"
                } rounded-full shadow-md transform transition-transform duration-300 ${
                  filtro === "folio" ? "translate-x-10" : ""
                }`}
              ></div>
            </div>
            <span
              className={`text-lg font-semibold ${
                filtro === "folio" ? "text-pink-400" : "text-gray-500"
              }`}
            >
              Folio
            </span>
          </div>

          {/* Buscador */}
          <div className="relative flex items-center group w-full max-w-md">
            <div className="absolute left-0 h-10 w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FaSearch className="text-white text-lg" />
            </div>
            <input
              type="text"
              placeholder={`Buscar por ${filtro}`}
              value={busqueda}
              onChange={handleBusqueda}
              className="pl-14 py-2 w-full rounded-full bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-cyan-400 transition-shadow duration-300"
            />
          </div>
        </div>
      </section>

      {/* Tabla de resultados */}
      {loading ? (
        <section className="space-y-4 px-8">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg shadow-md"
            >
              <div className="h-12 w-12 rounded-full bg-slate-400 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded-lg bg-slate-400 animate-pulse"></div>
                <div className="h-5 w-1/2 rounded-lg bg-slate-400 animate-pulse"></div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="overflow-x-auto px-8">
          <table className="w-full text-left border-collapse bg-gray-800 rounded-lg shadow-lg">
            <thead className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 text-gray-300">
              <tr>
                <th className="p-4">Folio</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Paciente</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Nómina</th>
                <th className="p-4">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((item) => (
                  <tr
                    key={item.folio}
                    className="hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(item.folio)}
                  >
                    <td className="p-4 border-b border-gray-700">{item.folio}</td>
                    <td className="p-4 border-b border-gray-700">
                      {item.especialidad}
                    </td>
                    <td className="p-4 border-b border-gray-700">
                      {item.paciente}
                    </td>
                    <td className="p-4 border-b border-gray-700">
                      {item.fecha}
                    </td>
                    <td className="p-4 border-b border-gray-700">
                      {item.nomina}
                    </td>
                    <td
                      className={`p-4 border-b border-gray-700 font-bold ${
                        item.estatus === "ACTIVA"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.estatus}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="p-4 text-center text-gray-500 border-b border-gray-700"
                  >
                    No se encontraron datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default PasesAEspecialidad;
