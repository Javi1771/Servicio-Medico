import React, { useEffect, useState } from "react";

const Loader = ({ size = 30, duration = 15000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Texto superior (opcional, se deja vacío si no se quiere mostrar) */}
      <p
        className="text-2xl font-bold tracking-wide text-[#EFE9FE]"
        style={{ fontSize: `${size / 3.5}px` }}
      >
      </p>

      {/* Texto "cargando" (opcional, se deja vacío si no se quiere mostrar) */}
      <p
        className="text-4xl font-extrabold tracking-wider text-[#EFE9FE] uppercase animate-gradient-text"
        style={{ fontSize: `${size / 4}px` }}
      >
      </p>

      {/* Contenedor principal con fondo morado-oscuro */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-br from-[#2B0D4F] via-[#1C1F2F] to-[#1C1F2F] p-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
        style={{
          width: `${size * 2.1}px`,
          height: `${size * 2.1}px`,
        }}
      >
        {/* Círculo pulsante para efecto visual (morado) */}
        <div
          className="absolute rounded-full border-4 border-[#7F29D8] animate-pulse-slow"
          style={{
            width: `${size * 2.6}px`,
            height: `${size * 2.6}px`,
          }}
        ></div>

        {/* Monitor cardíaco animado con trazo morado */}
        <svg
          className="absolute animate-cardiograma"
          viewBox="0 0 100 100"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
          }}
        >
          <path
            d="M 0 50 L 10 60 L 25 20 L 40 80 L 55 15 L 70 90 L 85 40 L 100 50"
            stroke="rgba(157, 93, 245, 0.9)" // #9A5DF5 con algo de opacidad
          />
        </svg>

        {/* Anillo rotatorio adicional (morado claro) */}
        <div
          className="absolute rounded-full border-2 border-[#9A5DF5] animate-rotate-slow"
          style={{
            width: `${size * 2.4}px`,
            height: `${size * 2.4}px`,
          }}
        ></div>
      </div>

      {/* Estilos del Loader */}
      <style jsx>{`
        @keyframes gradient-text {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes fancyCardiograma {
          0% {
            stroke-dashoffset: 500;
            stroke: rgba(157, 93, 245, 0.9);
            transform: scaleY(1);
          }
          20% {
            stroke: rgba(130, 70, 220, 1);
            transform: scaleY(1.3);
          }
          40% {
            stroke: rgba(175, 110, 255, 0.7);
            transform: scaleY(0.8);
          }
          60% {
            stroke: rgba(130, 70, 220, 1);
            transform: scaleY(1.5);
          }
          80% {
            stroke: rgba(157, 93, 245, 0.9);
            transform: scaleY(1);
          }
          100% {
            stroke-dashoffset: 0;
            stroke: rgba(175, 110, 255, 1);
            transform: scaleY(1);
          }
        }

        @keyframes rotate-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        .animate-cardiograma {
          stroke-dasharray: 500;
          animation: fancyCardiograma 3s ease-in-out infinite alternate;
        }

        .animate-rotate-slow {
          animation: rotate-slow 6s linear infinite;
        }

        .animate-gradient-text {
          background: linear-gradient(90deg, #7F29D8, #9A5DF5);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-text 4s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default Loader;
