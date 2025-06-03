/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FiBell } from "react-icons/fi";
import { useRouter } from "next/navigation";
import clsx from "clsx";

/* ––––––––– Config   ––––––––– */
const SIZES = {
  base: "h-12 w-12",          // 48 px
  md:   "md:h-14 md:w-14",    // 56 px
  lg:   "lg:h-16 lg:w-16"     // 64 px
};
const GLOW_COLOR = "rgba(251, 191, 36, 0.55)"; // amber-400/55

/* ––––––––– Componente ––––––––– */
const NotificationBell = () => {
  const router = useRouter();
  const [unread, setUnread] = useState(false);

  /* 📥 Fetch rápido de avisos */
  const fetchAvisos = async () => {
    try {
      const res    = await fetch("/api/avisos");
      const avisos = await res.json();
      if (!avisos?.length) return;
      const lastSeen = Number(localStorage.getItem("avisos_last_seen") || 0);
      const latest   = new Date(avisos[0].Fecha).getTime();
      setUnread(latest > lastSeen);
    } catch {/* … */}
  };

  useEffect(() => {
    fetchAvisos();
    const id = setInterval(fetchAvisos, 60_000);
    return () => clearInterval(id);
  }, []);

  /* 🖱️ Click */
  const goToAvisos = () => {
    // playSound("/assets/notify.mp3");
    localStorage.setItem("avisos_last_seen", `${Date.now()}`);
    setUnread(false);
    router.push("/notificaciones/avisos-desarrolladores");
  };

  /* ––––––––– Render ––––––––– */
  return (
    <Tooltip.Provider delayDuration={250}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            onClick={goToAvisos}
            aria-label="Avisos de actualización"
            className={clsx(
              "relative rounded-full border backdrop-blur-md transition-colors duration-300",
              "border-black/10 dark:border-white/15",
              "bg-white/30 dark:bg-white/5",
              SIZES.base, SIZES.md, SIZES.lg
            )}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92, rotate: -10 }}
          >
            {/* Anillo concéntrico */}
            <span
              className={clsx(
                "absolute inset-0 rounded-full pointer-events-none",
                "ring-2",
                unread
                  ? "ring-amber-400/60"
                  : "ring-gray-300/40 dark:ring-white/10"
              )}
            />

            {/* Pulso animado solo si hay avisos */}
            <AnimatePresence>
              {unread && (
                <motion.span
                  key="pulse"
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity }}
                  style={{ background: GLOW_COLOR, filter: "blur(8px)" }}
                />
              )}
            </AnimatePresence>

            {/* Icono */}
            <FiBell
              className={clsx(
                "relative z-10 mx-auto",
                "text-[1.35rem] md:text-[1.55rem] lg:text-[1.7rem]",
                unread
                  ? "text-amber-300 drop-shadow-[0_0_6px_#facc15]"
                  : "text-white dark:text-white"
              )}
            />

            {/* Punto rojo */}
            {unread && (
              <>
                <span className="absolute top-1.5 right-1.5 z-20 h-3 w-3 rounded-full bg-red-500" />
                <span className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full bg-red-500 animate-ping opacity-70" />
              </>
            )}

            {/* Área accesible para lectores de pantalla */}
            <span aria-live="polite" role="status" className="sr-only">
              {unread ? "Tienes avisos nuevos" : "Sin avisos nuevos"}
            </span>
          </motion.button>
        </Tooltip.Trigger>

        {/* Tooltip */}
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            sideOffset={6}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm shadow-xl",
              "bg-gray-800 text-white dark:bg-gray-900",
              "animate-fade-in"
            )}
          >
            {unread ? "Tienes avisos sin leer" : "No hay avisos nuevos"}
            <Tooltip.Arrow className="fill-gray-800 dark:fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default NotificationBell;
