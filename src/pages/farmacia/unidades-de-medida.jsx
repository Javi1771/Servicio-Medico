import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPlusCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const InsertarUnidadForm = () => {
  const [medida, setMedida] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medida) {
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Campo requerido</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, ingresa una unidad de medida.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/farmacia/insertarUnidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medida }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al insertar");
      }
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Unidad insertada</span>",
        html: `<p style='color: #fff; font-size: 1.1em;'>${data.message}</p>`,
        background: "linear-gradient(145deg, #003300, #001a00)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,255,118,0.9)] rounded-lg",
        },
      });
      setMedida("");
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Error</span>",
        html: `<p style='color: #fff; font-size: 1.1em;'>${error.message}</p>`,
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div
        className="bg-gradient-to-br from-gray-900 to-black p-10 rounded-3xl shadow-2xl border border-white border-opacity-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-6">
          <FaPlusCircle className="text-6xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
        <h2 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg">
          Nueva Unidad de Medida
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label htmlFor="medida" className="text-white font-bold text-lg mb-2">
              Unidad Abrebviada:
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
      </motion.div>
    </div>
  );
};

export default InsertarUnidadForm;
