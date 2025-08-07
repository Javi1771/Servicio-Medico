/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { showCustomAlert } from "../../utils/alertas";
import Image from "next/image";
import {
  FiImage,
  FiSend,
  FiFileText,
  FiArrowLeft,
  FiThumbsUp,
  FiCheckCircle,
} from "react-icons/fi";
import { MdImageNotSupported } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";

//* ───────────── sonidos ───────────── */
const successSound = "/assets/applepay.mp3";
const playSound = (src) => {
  const a = new Audio(src);
  a.volume = 0.7;
  a.play().catch(() => {});
};

export default function PropuestasMejora() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ texto: "", motivo: "" });
  const [busyLike, setBusyLike] = useState(false);
  const [modal, setModal] = useState(null);

  const router = useRouter();
  const role = Cookies.get("rol");
  const defaultGrad = "from-indigo-500 via-fuchsia-800 to-purple-600";
  const completedGrad = "from-green-800 via-[#436d07] to-green-600";
  const glass = "backdrop-blur-lg ring-1 ring-white/10 shadow-xl";
  const heading =
    "bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent";

  const normalize = (arr) =>
    arr.map((p) => ({ ...p, Completado: !!p.Completado }));

  //* ①. Declara fetchPosts _antes_ del useEffect:
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/propuestas");
      const data = await r.json();
      setPosts(Array.isArray(data) ? normalize(data) : []);
    } catch {
      await showCustomAlert(
        "error",
        "Error",
        "No se pudieron obtener las propuestas",
        "Aceptar"
      );

      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.texto.trim()) return;

    await showCustomAlert(
      "warning",
      "Describe tu propuesta",
      "Escribe alguna propuesta para los desarrolladores",
      "Aceptar"
    );

    const body = new FormData();
    body.append("texto", form.texto);
    body.append("motivo", form.motivo);
    if (file) body.append("imagen", file);

    try {
      const r = await fetch("/api/propuestas", { method: "POST", body });
      if (!r.ok) throw new Error((await r.json()).error);

      await showCustomAlert(
        "success",
        "Hecho",
        "¡Propuesta publicada!",
        "Aceptar"
      );

      setForm({ texto: "", motivo: "" });
      setFile(null);
      await fetchPosts();
    } catch (err) {
      await showCustomAlert("error", "Ups", err.message, "Aceptar");
    }
  };

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

  const markComplete = async (id) => {
    try {
      const res = await fetch(`/api/propuestas?id=${id}&complete=1`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("No se pudo completar");
      setPosts((arr) =>
        arr.map((p) => (p.IdPropuesta === id ? { ...p, Completado: true } : p))
      );

      await showCustomAlert(
        "success",
        "Listo",
        "¡Marcada como completada!",
        "Aceptar"
      );
    } catch (err) {
      await showCustomAlert("error", "Error", err.message, "Aceptar");
    }
  };

  return (
    <>
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-[#13182e] via-[#1b1433] to-[#0d0b24]" />
      <div className="pointer-events-none fixed inset-0 -z-20 animate-stars opacity-15" />

      <div className="relative z-10 min-h-screen flex flex-col px-4 sm:px-8 py-10 text-slate-100">
        <button
          type="button"
          onClick={() => {
            setModal(null); //! cierra modal
            setTimeout(
              () => router.push("/notificaciones/avisos-desarrolladores"),
              0
            );
          }}
          className="self-start mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition"
        >
          <FiArrowLeft /> Regresar
        </button>

        {/* Título */}
        <h1
          className={`text-center text-4xl sm:text-5xl font-extrabold ${heading}`}
        >
          Propuestas&nbsp;de&nbsp;Mejora
        </h1>
        <div
          className={`mx-auto mt-3 h-1.5 w-48 rounded-full bg-gradient-to-r ${defaultGrad}`}
        />

        {/* Formulario */}
        <div
          className={`mx-auto mt-14 w-full max-w-5xl rounded-3xl p-[2px] bg-gradient-to-r ${defaultGrad}`}
        >
          <form
            onSubmit={handleSubmit}
            className={`rounded-[inherit] bg-[#0e1628]/60 ${glass} p-8 sm:p-10 space-y-6`}
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
            <textarea
              rows={2}
              placeholder="Motivo (opcional)"
              className="w-full resize-none rounded-lg bg-white/10 p-4 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
            <label
              className={`block w-full cursor-pointer rounded-xl p-[2px] bg-gradient-to-r ${defaultGrad} hover:shadow-lg transition`}
            >
              <div className="flex flex-col items-center gap-3 rounded-[inherit] border-2 border-dashed border-fuchsia-400/40 bg-[#0e1628]/60 px-4 py-6 sm:py-8 backdrop-blur-lg">
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
              className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${defaultGrad} px-6 py-3 text-sm sm:text-base font-semibold shadow-md hover:brightness-110 transition`}
            >
              <FiSend /> Publicar
            </button>
          </form>
        </div>

        {/* Listado */}
        <section className="mx-auto mt-20 w-full max-w-6xl flex-1">
          {loading ? (
            <p className="text-center">Cargando propuestas…</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-400">No hay propuestas aún.</p>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => {
                const completed = !!p.Completado;
                const gradStyle = completed ? completedGrad : defaultGrad;
                const ringHover = completed
                  ? "hover:ring-green-400"
                  : "hover:ring-fuchsia-400";
                const shadowHover = completed
                  ? "hover:shadow-green-400/40"
                  : "hover:shadow-fuchsia-500/40";

                return (
                  <div
                    key={p.IdPropuesta}
                    onClick={() => setModal(p)}
                    className={`relative flex cursor-pointer rounded-3xl p-[2px] bg-gradient-to-r ${gradStyle} shadow-lg hover:shadow-xl hover:!scale-100 hover:ring-2 ${ringHover} ${shadowHover} transition`}
                  >
                    <article
                      className={`flex flex-1 flex-col rounded-[inherit] ${
                        completed ? "bg-green-900/40" : "bg-[#0f1a2e]/60"
                      } p-6 backdrop-blur-lg`}
                    >
                      {p.Url_Imagen ? (
                        <Image
                          src={p.Url_Imagen}
                          alt="Propuesta"
                          width={450}
                          height={250}
                          unoptimized={p.Url_Imagen.startsWith("http")}
                          className="mb-4 h-44 w-full rounded-t-[inherit] object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex h-44 w-full items-center justify-center rounded-t-[inherit] bg-white/10">
                          <MdImageNotSupported
                            className={`text-5xl ${
                              completed
                                ? "text-green-400/70"
                                : "text-fuchsia-400/70"
                            }`}
                          />
                        </div>
                      )}

                      <div className="flex-1 flex flex-col">
                        <p className="text-sm leading-relaxed line-clamp-3">
                          {p.Propuesta}
                        </p>
                        {p.Motivo && (
                          <p
                            className={`mt-3 text-xs ${
                              completed ? "text-green-300" : "text-fuchsia-300"
                            } line-clamp-2`}
                          >
                            <strong
                              className={completed ? "text-green-200" : ""}
                            >
                              Motivo:
                            </strong>{" "}
                            {p.Motivo}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between">
                          <time
                            className={`text-[10px] sm:text-xs ${
                              completed ? "text-green-300" : "text-slate-400"
                            }`}
                          >
                            {p.Fecha}
                          </time>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={busyLike || p.YaLike === 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                giveLike(p.IdPropuesta);
                              }}
                              className={`group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                p.YaLike === 1
                                  ? "bg-fuchsia-500/20 text-fuchsia-400 cursor-not-allowed"
                                  : "bg-white/10 hover:bg-fuchsia-500/20 hover:text-fuchsia-300"
                              }`}
                            >
                              <FiThumbsUp className="text-sm group-hover:scale-110 transition" />{" "}
                              {p.Likes}
                            </button>
                            {role === "7" && !completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markComplete(p.IdPropuesta);
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30"
                              >
                                <FiCheckCircle className="text-sm" /> Completar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-[2px] bg-gradient-to-r ${
              modal.Completado ? completedGrad : defaultGrad
            } shadow-xl`}
          >
            <section className="rounded-[inherit] bg-[#0e1624]/80 backdrop-blur-lg">
              <header
                className={`flex items-center gap-3 px-8 py-4 rounded-t-[inherit] border-b ${
                  modal.Completado
                    ? "bg-gradient-to-r from-green-700/40 to-green-600/40 border-green-600/60"
                    : "bg-fuchsia-700/30 border-fuchsia-400/30"
                }`}
              >
                <FiFileText
                  className={`text-xl shrink-0 ${
                    modal.Completado ? "text-green-200" : "text-fuchsia-400"
                  }`}
                />
                <h3 className="text-lg font-semibold text-slate-100">
                  Detalle de la propuesta
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className={`ml-auto text-2xl transition ${
                    modal.Completado
                      ? "text-green-300 hover:text-green-200"
                      : "text-fuchsia-300 hover:text-fuchsia-400"
                  }`}
                >
                  ×
                </button>
              </header>

              <div className="p-8 space-y-6">
                {modal.Url_Imagen ? (
                  <Image
                    src={modal.Url_Imagen}
                    alt="zoom"
                    width={1200}
                    height={700}
                    unoptimized={modal.Url_Imagen.startsWith("http")}
                    className="w-full max-h-[50vh] rounded-xl object-contain mb-4"
                  />
                ) : (
                  <div className="mb-4 flex h-52 w-full items-center justify-center rounded-xl bg-white/10">
                    <MdImageNotSupported
                      className={`text-6xl ${
                        modal.Completado
                          ? "text-green-200/70"
                          : "text-fuchsia-400/70"
                      }`}
                    />
                  </div>
                )}

                <div
                  className={`flex items-start gap-3 text-sm ${
                    modal.Completado ? "text-green-200" : "text-fuchsia-300"
                  }`}
                >
                  <FaCalendarAlt className="shrink-0 mt-0.5" />
                  <time className="font-medium">{modal.Fecha}</time>
                </div>

                <div className="flex items-start gap-3">
                  <FiFileText
                    className={`shrink-0 mt-0.5 text-xl ${
                      modal.Completado ? "text-green-200" : "text-fuchsia-400"
                    }`}
                  />
                  <p className="whitespace-pre-wrap leading-relaxed text-base text-slate-200">
                    {modal.Propuesta}
                  </p>
                </div>

                {modal.Motivo && (
                  <div className="flex items-start gap-3">
                    <FiFileText
                      className={`shrink-0 mt-0.5 text-xl ${
                        modal.Completado ? "text-green-200" : "text-indigo-400"
                      }`}
                    />
                    <p className="whitespace-pre-wrap text-slate-300">
                      <strong
                        className={modal.Completado ? "text-green-200" : ""}
                      >
                        Motivo:
                      </strong>{" "}
                      {modal.Motivo}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
