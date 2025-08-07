import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlusCircle, FaArrowLeft, FaSearch } from "react-icons/fa";
import { useRouter } from "next/router";

import { showCustomAlert } from "../../utils/alertas";
const InsertarUnidadForm = () => {
  const router = useRouter();

  //* Estado para la nueva unidad
  const [medida, setMedida] = useState("");
  //* Estado para la lista de unidades ya existentes
  const [unidades, setUnidades] = useState([]);
  //* Estado para manejar el spinner de "Insertando..."
  const [loading, setLoading] = useState(false);

  //* Campo de búsqueda para filtrar unidades
  const [searchTerm, setSearchTerm] = useState("");

  //* Función para reproducir sonido al pasar por la tarjeta
  const playTapSound = () => {
    const audio = new Audio("/assets/tap.mp3");
    audio.play();
  };

  //* Al montar el componente, obtenemos las unidades existentes
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await fetch("/api/farmacia/unidades");
        const data = await res.json();
        //console.log("Respuesta del endpoint en el cliente:", data);
        if (res.ok && Array.isArray(data)) {
          //* El endpoint retorna un array con { code, label }
          setUnidades(data);
        } else if (res.ok && data.recordset) {
          //* O en caso de un objeto con recordset
          setUnidades(data.recordset);
        } else {
          setUnidades([]);
        }
      } catch (err) {
        console.error("Error fetching unidades:", err);
        setUnidades([]);
      }
    };
    fetchUnidades();
  }, []);

  //* Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medida) {
      await showCustomAlert(
        "error",
        "Campo requerido",
        "Por favor, ingresa una unidad de medida.",
        "Aceptar"
      );

      return;
    }

    //* Validar duplicados localmente
    const medidaNormalized = medida.trim().toLowerCase();
    const duplicado = unidades.find(
      (u) => u.label.trim().toLowerCase() === medidaNormalized
    );
    if (duplicado) {
      await showCustomAlert(
        "error",
        "Unidad duplicada",
        "La unidad de medida ya existe.",
        "Aceptar"
      );

      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/farmacia/insertarUnidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medida }),
      });
      const dataResponse = await res.json();
      if (!res.ok) throw new Error(dataResponse.message || "Error al insertar");

      await showCustomAlert(
        "success",
        "Unidad insertada",
        dataResponse.message,
        "Aceptar"
      );

      setMedida("");

      //* Actualiza la lista de unidades
      const resUnidades = await fetch("/api/farmacia/unidades");
      const unidadesData = await resUnidades.json();
      if (resUnidades.ok && Array.isArray(unidadesData)) {
        setUnidades(unidadesData);
      } else if (resUnidades.ok && unidadesData.recordset) {
        setUnidades(unidadesData.recordset);
      } else {
        setUnidades([]);
      }
    } catch (error) {
      await showCustomAlert("error", "Error", error.message, "Aceptar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  //* Filtra las unidades según el searchTerm
  const unidadesFiltradas = unidades.filter((u) =>
    u.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div
        className="relative bg-gradient-to-br from-gray-900 to-black p-10 rounded-3xl shadow-2xl border border-white border-opacity-20 w-full max-w-5xl mx-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header con botón de regreso integrado */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Regresar</span>
          </button>
          <FaPlusCircle className="text-6xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <div className="w-24" />
        </div>

        <h2 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg">
          Nueva Unidad de Medida
        </h2>

        {/* Formulario de inserción */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="medida"
              className="text-white font-bold text-lg mb-2"
            >
              Unidad Abreviada:
            </label>
            <input
              type="text"
              id="medida"
              name="medida"
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
              placeholder="Ej: mg, ml, cap, etc."
              className="p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-white transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-white to-gray-400 text-black font-bold uppercase tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-300"
          >
            {loading ? "Insertando..." : "Insertar Unidad"}
          </button>
        </form>

        {/* Sección de unidades existentes */}
        <div className="mt-10">
          <h3 className="text-2xl font-bold text-white mb-4">
            Unidades Existentes
          </h3>
          {/* Input para filtrar unidades */}
          <div className="flex items-center gap-2 mb-6 bg-gray-800 rounded-md p-2">
            <FaSearch className="text-white ml-2" />
            <input
              type="text"
              placeholder="Buscar unidad..."
              className="flex-1 bg-transparent text-white focus:outline-none px-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Grid de tarjetas con borde neon */}
          {unidadesFiltradas.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {unidadesFiltradas.map((unidad) => (
                <div
                  key={unidad.code}
                  className="
                    neon-card
                    p-4
                    rounded-lg
                    bg-gray-800
                    text-white
                    transition-transform
                    hover:scale-105
                    hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]
                    cursor-pointer
                  "
                  onMouseEnter={playTapSound}
                >
                  <h4 className="text-xl font-bold ">{unidad.label}</h4>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white">No hay unidades</p>
          )}
        </div>
      </motion.div>

      {/* Estilos extra para la animación neon de las tarjetas */}
      <style jsx>{`
        .neon-card {
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .neon-card:hover {
          border-color: #00eaff;
          box-shadow: 0 0 15px #00eaff;
        }
      `}</style>
    </div>
  );
};

export default InsertarUnidadForm;
