/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  FiImage,
  FiSend,
  FiFileText,
  FiArrowLeft,
  FiThumbsUp,
} from "react-icons/fi";

/* ───────────── audio rutas ───────────── */
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

const playSound = (src) => {
  const a = new Audio(src);
  a.volume = 0.7;
  a.play().catch(() => {});
};

/* ───────────── alerta neón ───────────── */
const showAlert = (type, title, html = "") => {
  const theme = {
    success: {
      grad: "145deg,#004d40,#00251a",
      col: "#00e676",
      shadow: "0,230,118",
      sound: successSound,
      txtBtn: "#000",
    },
    error: {
      grad: "145deg,#4a0000,#220000",
      col: "#ff1744",
      shadow: "255,23,68",
      sound: errorSound,
      txtBtn: "#fff",
    },
    warning: {
      grad: "145deg,#4d3c00,#231d00",
      col: "#ffb300",
      shadow: "255,179,0",
      sound: errorSound,
      txtBtn: "#000",
    },
    info: {
      grad: "145deg,#00264d,#001326",
      col: "#40c4ff",
      shadow: "64,196,255",
      sound: successSound,
      txtBtn: "#000",
    },
  }[type];

  playSound(theme.sound);

  return Swal.fire({
    icon: type,
    title: `<span style="color:${theme.col};font-weight:bold;font-size:1.5em;">${title}</span>`,
    html: `<p style="color:#fff;font-size:1.1em;">${html}</p>`,
    background: `linear-gradient(${theme.grad})`,
    confirmButtonColor: theme.col,
    confirmButtonText: `<span style="color:${theme.txtBtn};font-weight:bold;">Aceptar</span>`,
    customClass: { popup: "rounded-lg" },
    didOpen: (el) => {
      el.style.border = `2px solid ${theme.col}`;
      el.style.boxShadow = `0 0 20px 5px rgba(${theme.shadow},0.9)`;
    },
  });
};

export default function PropuestasMejora() {
  /* --------------- state --------------- */
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ texto: "", motivo: "" });
  const [busyLike, setBusyLike] = useState(false);
  const [modal, setModal] = useState(null); // ← modal de detalle

  const router = useRouter();
  const grad = "from-indigo-500 via-fuchsia-600 to-purple-600";

  /* --------------- fetch --------------- */
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/propuestas");
      setPosts(await r.json());
    } catch {
      showAlert("error", "Error", "No se pudieron obtener las propuestas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  /* --------------- submit --------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.texto.trim())
      return showAlert("warning", "Describe tu propuesta");

    const body = new FormData();
    body.append("texto", form.texto);
    body.append("motivo", form.motivo);
    if (file) body.append("imagen", file);

    try {
      const r = await fetch("/api/propuestas", { method: "POST", body });
      if (!r.ok) throw new Error((await r.json()).error);
      showAlert("success", "¡Propuesta publicada!");
      setForm({ texto: "", motivo: "" });
      setFile(null);
      fetchPosts();
    } catch (err) {
      showAlert("error", "Ups", err.message);
    }
  };

  /* --------------- like --------------- */
  const giveLike = async (id) => {
    if (busyLike) return;
    setBusyLike(true);
    try {
      const r = await fetch(`/api/propuestas?id=${id}`, { method: "PATCH" });
      if (r.ok) {
        setPosts((arr) =>
          arr.map((p) =>
            p.IdPropuesta === id ? { ...p, Likes: p.Likes + 1, YaLike: 1 } : p
          )
        );
        playSound(successSound);
      }
    } finally {
      setBusyLike(false);
    }
  };

  /* --------------- helpers --------------- */
  const glass = "backdrop-blur-lg ring-1 ring-white/10 shadow-xl";
  const heading =
    "bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent";

  /* --------------- view --------------- */
  return (
    <>
      {/* fondo */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-[#13182e] via-[#1b1433] to-[#0d0b24]" />
      <div className="pointer-events-none fixed inset-0 -z-20 animate-stars opacity-15" />

      <div className="relative z-10 min-h-screen flex flex-col px-4 sm:px-8 py-10 text-slate-100">
        {/* volver */}
        <button
          onClick={() => router.replace("/notificaciones/avisos-desarrolladores")}
          className="mb-8 w-max inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-purple-600 px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-md"
        >
          <FiArrowLeft /> Volver
        </button>

        {/* título */}
        <h1 className={`text-center text-4xl sm:text-5xl font-extrabold ${heading}`}>
          Propuestas&nbsp;de&nbsp;Mejora
        </h1>
        <div className={`mx-auto mt-3 h-1.5 w-48 rounded-full bg-gradient-to-r ${grad}`} />

        {/* ---------- formulario ---------- */}
        <div className={`mx-auto mt-14 w-full max-w-5xl rounded-3xl p-[2px] bg-gradient-to-r ${grad}`}>
          <form
            onSubmit={handleSubmit}
            className={`rounded-[inherit] bg-[#0e1628]/80 ${glass} p-8 sm:p-10 space-y-6`}
          >
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-fuchsia-400">
              <FiFileText /> Publica tu propuesta
            </h2>

            <textarea
              rows={4}
              placeholder="DESCRIBE LA PROPUESTA…"
              className="w-full resize-none rounded-lg bg-white/10 p-4 uppercase tracking-wide text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
              value={form.texto}
              onChange={(e) =>
                setForm({ ...form, texto: e.target.value.toUpperCase() })
              }
            />

            <input
              type="text"
              placeholder="Motivo (opcional)"
              className="w-full rounded-lg bg-white/10 p-4 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />

            {/* upload */}
            <label
              className={`block w-full cursor-pointer rounded-xl p-[2px] bg-gradient-to-r ${grad} hover:shadow-lg transition`}
            >
              <div className="flex flex-col items-center gap-3 rounded-[inherit] border-2 border-dashed border-fuchsia-400/40 bg-[#0e1628]/70 px-4 py-6 sm:py-8 backdrop-blur-lg">
                <FiImage className="text-3xl sm:text-4xl text-fuchsia-400" />
                <span className="truncate text-xs sm:text-sm text-slate-300">
                  {file ? file.name : "Arrastra o haz clic para subir imagen"}
                </span>
              </div>
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${grad} px-6 py-3 text-sm sm:text-base font-semibold shadow-md hover:brightness-110`}
            >
              <FiSend /> Publicar
            </button>
          </form>
        </div>

        {/* ---------- listado ---------- */}
        <section className="mx-auto mt-20 w-full max-w-6xl flex-1">
          {loading ? (
            <p className="text-center">Cargando propuestas…</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-400">No hay propuestas aún.</p>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <article
                  key={p.IdPropuesta}
                  onClick={() => setModal(p)}
                  className={`relative cursor-pointer rounded-3xl p-[2px] bg-gradient-to-r ${grad}
                    shadow-lg hover:shadow-fuchsia-500/40 transition
                    group hover:ring-2 hover:ring-fuchsia-400/60`}
                >
                  <div
                    className={`rounded-[inherit] bg-[#0f1a2e]/80 ${glass} p-6 flex flex-col h-full
                      group-hover:blur-[1px] group-hover:opacity-70`}
                  >
                    {p.Url_Imagen ? (
                      <Image
                        src={p.Url_Imagen}
                        alt="Propuesta"
                        width={450}
                        height={250}
                        unoptimized={p.Url_Imagen.startsWith("http")}
                        className="mb-4 h-44 w-full rounded-xl object-cover"
                        placeholder="empty"
                      />
                    ) : (
                      <div className="mb-4 flex h-44 w-full items-center justify-center rounded-xl bg-white/10">
                        <FiImage className="text-5xl text-fuchsia-400/70" />
                      </div>
                    )}

                    <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {p.Propuesta}
                    </p>

                    {p.Motivo && (
                      <p className="mt-3 text-xs text-fuchsia-300">
                        <strong>Motivo:</strong> {p.Motivo}
                      </p>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                      <time className="text-[10px] sm:text-xs text-slate-400">
                        {new Date(p.Fecha).toLocaleString()}
                      </time>

                      <button
                        disabled={busyLike || p.YaLike}
                        onClick={(e) => {
                          e.stopPropagation(); // no abrir modal
                          giveLike(p.IdPropuesta);
                        }}
                        className={`group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
                          ${
                            p.YaLike
                              ? "bg-fuchsia-500/20 text-fuchsia-400 cursor-not-allowed"
                              : "bg-white/10 hover:bg-fuchsia-500/20 hover:text-fuchsia-300"
                          }`}
                      >
                        <FiThumbsUp className="text-sm group-hover:scale-110 transition" />
                        {p.Likes}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- modal ---------- */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-[2px]
              bg-gradient-to-r ${grad} shadow-xl`}
          >
            <section className="rounded-[inherit] bg-[#0e1524]/90 backdrop-blur-lg">
              {/* header */}
              <header className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 rounded-t-[inherit] border-b border-fuchsia-500/30">
                <FiFileText className="text-fuchsia-400 text-xl" />
                <h3 className="text-lg font-semibold text-slate-100">
                  Detalle de la propuesta
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="ml-auto text-2xl text-slate-400 hover:text-fuchsia-400 transition"
                >
                  ×
                </button>
              </header>

              {/* contenido */}
              <div className="p-8 space-y-6">
                {modal.Url_Imagen ? (
                  <Image
                    src={modal.Url_Imagen}
                    alt="zoom"
                    width={1200}
                    height={700}
                    unoptimized={modal.Url_Imagen.startsWith("http")}
                    className="w-full max-h-[50vh] rounded-xl object-contain mb-4"
                    placeholder="empty"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-xl bg-white/10">
                    <FiImage className="text-6xl text-fuchsia-400/70" />
                  </div>
                )}

                <div className="flex items-start gap-3 text-sm text-fuchsia-300">
                  <time className="font-medium">
                    {new Date(modal.Fecha).toLocaleString()}
                  </time>
                </div>

                <div className="flex items-start gap-3">
                  <FiFileText className="shrink-0 mt-0.5 text-fuchsia-400 text-xl" />
                  <p className="whitespace-pre-wrap leading-relaxed text-base text-slate-200">
                    {modal.Propuesta}
                  </p>
                </div>

                {modal.Motivo && (
                  <div className="flex items-start gap-3">
                    <FiFileText className="shrink-0 mt-0.5 text-indigo-400 text-xl" />
                    <p className="text-slate-300">
                      <span className="font-semibold">Motivo:</span> {modal.Motivo}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* estrellas */}
      <style jsx>{`
        @keyframes stars {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 600px;
          }
        }
        .animate-stars {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><circle cx="1" cy="1" r=".5" fill="white" opacity="0.6"/></svg>');
          animation: stars 120s linear infinite;
        }
      `}</style>
    </>
  );
}
