/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaClipboardList, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

//* Función reutilizable para mostrar alertas
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
    confirmButtonText:
      "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup: `border border-${styles.borderColor} shadow-[0px_0px_20px_5px_${styles.shadowColor}] rounded-lg`,
    },
  });
};

const PasesAEspecialidad = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  //* Filtrado de datos solo por nómina
  const datosFiltrados = datos.filter((item) =>
    item.nomina.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleRowClick = (folio) => {
    router.push(`/capturas/pases/crear-pase?claveconsulta=${folio}`);
  };

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-teal-700 text-white py-8 px-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-teal-700 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-5xl font-extrabold tracking-wide flex items-center justify-center gap-4 text-teal-300">
          <FaClipboardList className="text-teal-400" />
          Pases a Especialidad
        </h1>
        <button
          onClick={() => router.push("/capturas/pases/crear-pase-nuevo")}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-lg font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300"
        >
          <FaPlus className="inline-block mr-2" /> Nuevo Pase
        </button>
      </header>

      {/* Buscador */}
      <section className="py-8 px-4 md:px-10">
        <div className="relative flex items-center w-full max-w-lg mx-auto">
          <div className="absolute left-4 h-10 w-10 bg-gradient-to-r from-blue-700 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
            <FaSearch className="text-white text-xl" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Nómina"
            value={busqueda}
            onChange={handleBusqueda}
            className="pl-14 py-3 w-full rounded-full bg-gray-800 text-white placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition-all"
          />
        </div>
      </section>

      {/* Tabla de resultados */}
      <section className="overflow-x-auto px-4 md:px-10">
        <table className="w-full text-left border-collapse bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-teal-300">
            <tr>
              <th className="p-4">Especialidad</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Nómina</th>
              <th className="p-4">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="p-4">
                    <div className="h-6 w-20 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-32 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-24 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-32 bg-gray-600 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-16 bg-gray-600 rounded"></div>
                  </td>
                </tr>
              ))
            ) : datosFiltrados.length > 0 ? (
              datosFiltrados.map((item) => (
                <tr
                  key={item.folio}
                  className="hover:bg-gray-700 transition-all cursor-pointer"
                  onClick={() => handleRowClick(item.folio)}
                >
                  <td className="p-4 border-b border-gray-700">
                    {item.especialidad}
                  </td>
                  <td className="p-4 border-b border-gray-700">
                    {item.paciente}
                  </td>
                  <td className="p-4 border-b border-gray-700">{item.fecha}</td>
                  <td className="p-4 border-b border-gray-700">
                    {item.nomina}
                  </td>
                  <td
                    className={`p-4 border-b border-gray-700 font-bold ${
                      item.estatus === "EN ESPERA"
                        ? "text-red-400"
                        : "text-teal-400"
                    }`}
                  >
                    {item.estatus}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-4 text-center text-gray-500 border-b border-gray-700"
                >
                  No se encontraron datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PasesAEspecialidad;
