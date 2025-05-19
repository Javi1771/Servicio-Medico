// pages/laboratorio/registro-estudio.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { motion } from "framer-motion";
import { FiEdit2, FiTrash2, FiArrowLeft } from "react-icons/fi";

const MySwal = withReactContent(Swal);

// — Rutas de sonidos —
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";
const tapSound = "/assets/tap.mp3";

// — Reproduce sonido de éxito/error —
const playSound = (isSuccess) => {
  new Audio(isSuccess ? successSound : errorSound).play();
};

// — Reproduce sonido de “tap” —
const playTap = () => {
  new Audio(tapSound).play();
};

// — Estilos para alertas (coincidentes con tu ejemplo) —
const alertStyles = {
  success: {
    icon: "success",
    titleColor: "#00e676",
    bg: "linear-gradient(145deg,#003300,#001a00)",
    btn: "#00e676",
    emoji: "✔️",
    rgb: "0,230,118",
    border: "green-600",
    btnTextColor: "#000",
  },
  error: {
    icon: "error",
    titleColor: "#ff1744",
    bg: "linear-gradient(145deg,#4a0000,#220000)",
    btn: "#ff1744",
    emoji: "❌",
    rgb: "255,23,68",
    border: "red-600",
    btnTextColor: "#fff",
  },
  warning: {
    icon: "warning",
    titleColor: "#ff9800",
    bg: "linear-gradient(145deg,#4a2600,#220f00)",
    btn: "#ff9800",
    emoji: "⚠️",
    rgb: "255,152,0",
    border: "yellow-600",
    btnTextColor: "#000",
  },
};

// — Muestra alerta simple (success/error/warning) con diseño idéntico a tu ejemplo —
async function showAlert(type, message, htmlMessage = null) {
  const s = alertStyles[type];
  playSound(type === "success");
  await MySwal.fire({
    icon: s.icon,
    title: `<span style='color: ${s.titleColor}; font-weight: bold; font-size: 1.5em;'>${s.emoji} ${message}</span>`,
    html:
      htmlMessage ?? `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: s.bg,
    confirmButtonColor: s.btn,
    confirmButtonText: `<span style='color: ${s.btnTextColor}; font-weight: bold;'>Aceptar</span>`,
    customClass: {
      popup: `border border-${s.border} shadow-[0_0_20px_5px_rgba(${s.rgb},0.9)] rounded-lg`,
    },
  });
}

// — Muestra confirmación de eliminación (warning) con diseño idéntico —
async function showConfirm(message) {
  const s = alertStyles.warning;
  playSound(false);
  return MySwal.fire({
    icon: s.icon,
    title: `<span style='color: ${s.titleColor}; font-weight: bold; font-size: 1.5em;'>${s.emoji} Confirmar</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: s.bg,
    showCancelButton: true,
    confirmButtonColor: s.btn,
    cancelButtonColor: "#718096",
    confirmButtonText: `<span style='color: ${s.btnTextColor}; font-weight: bold;'>Eliminar</span>`,
    cancelButtonText: `<span style='color: ${s.btnTextColor}; font-weight: bold;'>Cancelar</span>`,
    customClass: {
      popup: `border border-${s.border} shadow-[0_0_20px_5px_rgba(${s.rgb},0.9)] rounded-lg`,
    },
  });
}

export default function RegistroEstudio() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Fetch inicial
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/laboratorio/listaEstudios");
        if (!res.ok) throw new Error("No se pudo cargar los estudios");
        setEstudios(await res.json());
      } catch (err) {
        await showAlert(
          "error",
          "Error al cargar estudios",
          `<p style='color: #fff; font-size: 1.1em;'>${err.message}</p>`
        );
      }
    })();
  }, []);

  // Reset edit si vacío
  useEffect(() => {
    if (nombre === "") setEditingId(null);
  }, [nombre]);

  // Sugerencias
  const suggestions = useMemo(() => {
    if (!nombre.trim()) return [];
    const term = nombre.trim().toLowerCase();
    return estudios
      .filter(
        (e) =>
          e.estudio.toLowerCase().includes(term) &&
          e.estudio.toLowerCase() !== term
      )
      .slice(0, 5);
  }, [nombre, estudios]);

  // Filtrado
  const filtered = useMemo(() => {
    if (!nombre.trim()) return estudios;
    const term = nombre.trim().toLowerCase();
    return estudios.filter((e) => e.estudio.toLowerCase().includes(term));
  }, [nombre, estudios]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const displayed = filtered.slice((page - 1) * perPage, page * perPage);

  // Create / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    playTap();
    const trimmed = nombre.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit
        ? "/api/laboratorio/editarEstudio"
        : "/api/laboratorio/guardarEstudios";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { id: editingId, nombre: trimmed }
        : { nombre: trimmed };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Operación fallida");

      await showAlert(
        "success",
        isEdit ? "Estatus actualizado" : "Registrado con éxito"
      );
      setNombre("");
      setEditingId(null);
      setEstudios(await (await fetch("/api/laboratorio/listaEstudios")).json());
      setPage(1);
    } catch (err) {
      await showAlert(
        "error",
        "Error en operación",
        `<p style='color:#fff; font-size:1.1em;'>${err.message}</p>`
      );
    } finally {
      setLoading(false);
    }
  };

  // Preparar edición
  const handleEdit = (estudio) => {
    playTap();
    setEditingId(estudio.claveEstudio);
    setNombre(estudio.estudio);
  };

  // Eliminar
  const handleDelete = async (id) => {
    playTap();
    const { isConfirmed } = await showConfirm(
      "¿Seguro que deseas eliminar este estudio?"
    );
    if (!isConfirmed) return;
    try {
      await fetch("/api/laboratorio/eliminarEstudio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await showAlert("success", "Eliminado con éxito");
      setEstudios(await (await fetch("/api/laboratorio/listaEstudios")).json());
    } catch (err) {
      await showAlert(
        "error",
        "Error al eliminar",
        `<p style='color:#fff; font-size:1.1em;'>${err.message}</p>`
      );
    }
  };

  const borderColors = [
    "border-pink-500",
    "border-green-500",
    "border-blue-500",
    "border-yellow-500",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-xl py-4 mb-8">
        <div className="max-w-6xl mx-auto flex items-center px-6 space-x-4">
          <button
            onClick={() => {
              playTap();
              router.push("/inicio-servicio-medico");
            }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-extrabold tracking-wide">
            Servicio Médico – Estudios
          </h1>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-700 opacity-20 rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-700 opacity-20 rounded-full mix-blend-screen animate-pulse" />
      </header>

      <main className="max-w-6xl mx-auto px-6 space-y-12">
        {/* Formulario */}
        <section className="bg-white bg-opacity-60 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-l-8 border-cyan-500">
          <h2 className="text-2xl font-bold mb-6 text-cyan-700">
            {editingId ? "✏️ Editar Estudio" : "➕ Nuevo Estudio"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="flex-1">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder="Escribe el nombre del estudio..."
                className="uppercase w-full bg-gray-100 border border-gray-300 rounded-lg py-3 px-5 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-cyan-200 transition"
              />

              {suggestions.length > 0 && (
                <ul className="mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-30">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        playTap();
                        setNombre(s.estudio);
                      }}
                      className="px-5 py-3 hover:bg-cyan-100 cursor-pointer transition"
                    >
                      {s.estudio}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 text-white font-semibold rounded-full disabled:opacity-50 transition ${
                editingId
                  ? "bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600"
                  : "bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600"
              }`}
            >
              {editingId ? "💾 Guardar Cambios" : "📝 Registrar Estudio"}
            </button>
          </form>
        </section>

        {/* Grid de cards */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-indigo-700">
            🗂️ Estudios (Página {page}/{totalPages})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {displayed.map((e, idx) => (
              <motion.div
                key={e.claveEstudio}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04 }}
                onHoverStart={playTap}
                className={`bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col border-4 ${
                  borderColors[idx % borderColors.length]
                } transition`}
              >
                <h3
                  className="font-bold text-xl mb-4 break-words"
                  title={e.estudio}
                >
                  {e.estudio}
                </h3>
                <div className="mt-auto flex space-x-3 justify-end">
                  <button
                    onClick={() => handleEdit(e)}
                    className="p-2 bg-yellow-400 rounded-full hover:bg-yellow-500 transition"
                  >
                    <FiEdit2 color="#fff" size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(e.claveEstudio)}
                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition"
                  >
                    <FiTrash2 color="#fff" size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-center items-center space-x-6 mt-12">
            <button
              onClick={() => {
                playTap();
                setPage((p) => Math.max(p - 1, 1));
              }}
              disabled={page === 1}
              className="px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 transition"
            >
              ← Anterior
            </button>
            <button
              onClick={() => {
                playTap();
                setPage((p) => Math.min(p + 1, totalPages));
              }}
              disabled={page === totalPages}
              className="px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Siguiente →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
