/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { showCustomAlert } from "../../utils/alertas";
import Image from "next/image";
import {
  FiSend,
  FiFileText,
  FiX,
  FiImage,
  FiArrowLeft,
  FiClock,
  FiEdit3,
} from "react-icons/fi";
import { MdImageNotSupported } from "react-icons/md";

export default function AvisosDesarrolladores() {
  //* ────────── state & router ────────── */
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    aviso: "",
    motivo: "",
    urgencia: "NORMAL",
  });
  const [modal, setModal] = useState(null);

  const rol = Cookies.get("rol");
  const router = useRouter();

  //* ===== helpers de color / gradiente ===== */
  const gradientForUrgency = (u) =>
    u === "URGENTE"
      ? "from-red-600 to-orange-500"
      : "from-teal-500 to-purple-600";
  const colorForUrgency = (u) =>
    u === "URGENTE" ? "text-orange-400" : "text-teal-400";

  //* ────────── fetch avisos ────────── */
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/avisos", { signal: ctrl.signal });
        const payload = await r.json();
        //console.log("[GET /api/avisos] payload:", payload);

        //* Si viene un array plano
        if (Array.isArray(payload)) {
          setAvisos(payload);
        }
        //* Si viene { raw, formatted }
        else if (payload.formatted) {
          setAvisos(payload.formatted);
        } else if (payload.raw) {
          setAvisos(payload.raw);
        } else {
          setAvisos([]);
        }
      } catch (err) {
        if (err.name !== "AbortError")
          await showCustomAlert(
            "error",
            "Error",
            "No se pudieron obtener los avisos",
            "Aceptar"
          );
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  //* ────────── post aviso ────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const avisoTxt = form.aviso.trim();
    if (!avisoTxt) return;

    await showCustomAlert("warning", "Alerta", "Escribe un aviso", "Aceptar");

    const body = new FormData();
    body.append("aviso", avisoTxt.toUpperCase());
    body.append("motivo", form.motivo);
    body.append("urgencia", form.urgencia);
    if (file) body.append("imagen", file);

    try {
      const r = await fetch("/api/avisos", { method: "POST", body });
      if (!r.ok) throw new Error((await r.json()).error);

      await showCustomAlert("success", "Hecho", "¡Aviso publicado!", "Aceptar");

      setForm({ aviso: "", motivo: "", urgencia: "NORMAL" });
      setFile(null);

      //* Refrescar lista
      const r2 = await fetch("/api/avisos");
      const payload2 = await r2.json();
      //console.log("[REFRESH GET /api/avisos] payload:", payload2);

      if (Array.isArray(payload2)) {
        setAvisos(payload2);
      } else if (payload2.formatted) {
        setAvisos(payload2.formatted);
      } else if (payload2.raw) {
        setAvisos(payload2.raw);
      } else {
        setAvisos([]);
      }
    } catch (err) {
      await showCustomAlert("error", "Ups", err.message, "Aceptar");
    }
  };

  //* ────────── view ────────── */
  return (
    <>
      {/* fondo & estrellas */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-[#12203a] via-[#141833] to-[#0d0b24]" />
      <div className="pointer-events-none fixed inset-0 -z-20 animate-stars opacity-15" />

      {/* ===== CONTENEDOR PRINCIPAL ===== */}
      <div className="relative z-10 min-h-screen px-6 py-12 text-slate-100 flex flex-col">
        {/* barra acciones */}
        <div className="mb-10 flex w-full items-center justify-between px-6">
          <button
            onClick={() => router.replace("/inicio-servicio-medico")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-purple-600 px-5 py-2 text-sm font-semibold shadow-lg"
          >
            <FiArrowLeft /> Regresar
          </button>

          <button
            onClick={() => router.push("/notificaciones/propuestas-mejora")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-5 py-2 text-sm font-semibold shadow-lg hover:brightness-110"
          >
            <FiEdit3 /> Proponer&nbsp;mejora
          </button>
        </div>

        {/* título */}
        <h1 className="mb-4 text-center text-5xl font-extrabold bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Centro&nbsp;de&nbsp;Avisos
        </h1>
        <div className="mx-auto mt-3 h-1.5 w-48 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-500" />

        {/* ----- formulario dev ----- */}
        {rol === "7" && (
          <div
            className={`mx-auto mt-14 w-full max-w-5xl rounded-3xl p-[2px] bg-gradient-to-r ${gradientForUrgency(
              form.urgencia
            )} shadow-xl`}
          >
            {/* grid  -> 1 col en móvil, 2 col en ≥lg */}
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-[inherit] bg-[#101826]/80 backdrop-blur-lg p-8"
            >
              {/* Col-span full para el título */}
              <h2
                className={`col-span-full flex items-center gap-2 text-2xl font-bold ${colorForUrgency(
                  form.urgencia
                )}`}
              >
                <FiFileText /> Publicar aviso
              </h2>

              {/* AVISO ─ ocupa ambas columnas */}
              <textarea
                rows={6}
                placeholder="ESCRIBE EL AVISO… (pulsa Enter para nueva línea)"
                className="col-span-full w-full resize-none rounded-lg bg-white/10 p-4
             tracking-wide uppercase  /* solo estilo visual */
             outline-none focus:ring-2 focus:ring-teal-500
             whitespace-pre-wrap" //* muestra saltos al volver a editar */
                value={form.aviso}
                onChange={(e) => setForm({ ...form, aviso: e.target.value })}
              />

              {/* Motivo – ocupa columna individual */}
              <textarea
                rows={2}
                placeholder="Motivo (pulsa Enter para nueva línea)"
                className="w-full resize-none rounded-lg bg-white/10 p-4
             outline-none focus:ring-2 focus:ring-purple-500
             whitespace-pre-wrap"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />

              {/* Urgencia */}
              <div className="flex items-center gap-3">
                <label htmlFor="urgencia" className="font-medium">
                  Urgencia:
                </label>
                <select
                  id="urgencia"
                  className="rounded-md bg-white text-black px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  value={form.urgencia}
                  onChange={(e) =>
                    setForm({ ...form, urgencia: e.target.value })
                  }
                >
                  <option className="text-black" value="NORMAL">
                    Normal
                  </option>
                  <option className="text-black" value="URGENTE">
                    Urgente
                  </option>
                </select>
              </div>

              {/* Imagen – ocupa ambas columnas para que el drop-zone quede ancho */}
              <label
                className={`col-span-full block w-full cursor-pointer rounded-xl p-[2px] bg-gradient-to-r ${gradientForUrgency(
                  form.urgencia
                )} hover:shadow-lg transition`}
              >
                <div
                  className={`flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-[#101826]/70 px-4 py-8 backdrop-blur-md border-2 border-dashed ${
                    form.urgencia === "URGENTE"
                      ? "border-orange-400/60"
                      : "border-teal-400/50"
                  }`}
                >
                  <FiImage
                    className={`text-4xl ${colorForUrgency(form.urgencia)}`}
                  />
                  <span className="truncate text-sm text-slate-300">
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

              {/* Botón – alineado a la derecha en desktop */}
              <button
                type="submit"
                className={`lg:col-span-2 lg:justify-self-end inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${gradientForUrgency(
                  form.urgencia
                )} px-7 py-3 font-semibold shadow-md hover:brightness-110`}
              >
                <FiSend /> Publicar
              </button>
            </form>
          </div>
        )}

        {/* ----- grid avisos ----- */}
        <section className="mx-auto mt-20 max-w-6xl flex-1">
          {loading ? (
            <p className="text-center">Cargando avisos…</p>
          ) : avisos.length === 0 ? (
            <p className="text-center text-slate-400">No hay avisos aún.</p>
          ) : (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {avisos.map((a) => {
                const grad = gradientForUrgency(a.Urgencia || "NORMAL");
                const ringHover =
                  a.Urgencia === "URGENTE"
                    ? "hover:ring-orange-400"
                    : "hover:ring-teal-400";
                const shadowHover =
                  a.Urgencia === "URGENTE"
                    ? "hover:shadow-orange-400/40"
                    : "hover:shadow-teal-400/40";

                return (
                  <div
                    key={a.IdAviso}
                    onClick={() => setModal(a)}
                    className={`
              relative flex rounded-2xl p-[1px] bg-gradient-to-r ${grad}
              transition shadow-lg hover:shadow-xl hover:!scale-100
              hover:ring-2 ${ringHover} ${shadowHover}
            `}
                  >
                    {/* Hacemos que <article> ocupe todo el alto y sea flex-col */}
                    <article className="flex flex-1 flex-col rounded-[inherit] bg-[#101826]/80 backdrop-blur-lg">
                      {/* Imagen */}
                      {a.Url_Imagen ? (
                        <Image
                          src={a.Url_Imagen}
                          alt="Aviso"
                          width={400}
                          height={400}
                          unoptimized={a.Url_Imagen.startsWith("http")}
                          className="h-48 w-full rounded-t-[inherit] object-cover"
                          placeholder="empty"
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center rounded-t-[inherit] bg-white/10">
                          <MdImageNotSupported className="text-5xl text-purple-400" />
                        </div>
                      )}

                      {/* Contenido con flex-1 para igualar altura */}
                      <div className="flex-1 p-6 flex flex-col">
                        {/* Aviso truncado a 3 líneas */}
                        <p
                          className="mb-3 leading-relaxed text-sm"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {a.Aviso}
                        </p>

                        {/* Motivo truncado a 2 líneas */}
                        {a.Motivo && (
                          <p
                            className="mb-4 text-sm text-purple-300"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            <strong>Motivo:</strong> {a.Motivo}
                          </p>
                        )}

                        {/* Fecha siempre al fondo */}
                        <div className="mt-auto">
                          <p className="text-xs text-slate-400">{a.Fecha}</p>
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

      {/* ---------- modal ---------- */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-[1px] bg-gradient-to-r ${gradientForUrgency(
              modal.Urgencia || "NORMAL"
            )} shadow-xl`}
          >
            <section className="rounded-[inherit] bg-[#0e1524]/90 backdrop-blur-lg">
              <header
                className={`flex items-center gap-3 px-8 py-4 rounded-t-[inherit] border-b
                  ${
                    modal.Urgencia === "URGENTE"
                      ? "bg-red-700/30 border-orange-400/40"
                      : "bg-teal-800/30 border-teal-500/30"
                  }`}
              >
                <FiFileText
                  className={`text-xl shrink-0
                    ${
                      modal.Urgencia === "URGENTE"
                        ? "text-orange-400"
                        : "text-teal-400"
                    }`}
                />
                <h3 className="text-lg font-semibold text-slate-100">
                  Detalle del aviso
                </h3>

                <button
                  onClick={() => setModal(null)}
                  className={`ml-auto text-2xl transition 
                    ${
                      modal.Urgencia === "URGENTE"
                        ? "text-orange-300 hover:text-orange-400"
                        : "text-teal-300 hover:text-teal-400"
                    }`}
                >
                  <FiX />
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
                    placeholder="empty"
                  />
                ) : (
                  <div className="mb-4 flex h-52 w-full items-center justify-center rounded-xl bg-white/10">
                    <MdImageNotSupported className="text-6xl text-purple-400" />
                  </div>
                )}

                <div
                  className={`flex items-start gap-3 text-sm
                    ${
                      modal.Urgencia === "URGENTE"
                        ? "text-orange-300"
                        : "text-teal-300"
                    }`}
                >
                  <FiClock className="shrink-0 mt-0.5" />
                  <time className="font-medium">{modal.Fecha}</time>
                </div>

                <div className="flex items-start gap-3">
                  <FiFileText className="shrink-0 mt-0.5 text-purple-400 text-xl" />
                  <p className="whitespace-pre-wrap leading-relaxed text-base text-slate-200">
                    {modal.Aviso}
                  </p>
                </div>

                {modal.Motivo && (
                  <div className="flex items-start gap-3">
                    <FiFileText className="shrink-0 mt-0.5 text-indigo-400 text-xl" />
                    <p className="whitespace-pre-wrap text-slate-300">
                      <span className="font-semibold">Motivo:</span>{" "}
                      {modal.Motivo}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* estrellas anim */}
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
