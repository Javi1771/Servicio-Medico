import React, { useEffect, useState } from "react";

const Loader = ({ text = "CARGANDO...", size = 48, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Texto Cargando */}
      <p
        className="text-4xl font-extrabold text-blue-700 animate-fade tracking-wider uppercase"
        style={{ fontSize: `${size / 4}px` }}
      >
        {text}
      </p>

      {/* Contenedor principal del monitor cardíaco */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-800 to-black p-6 rounded-full shadow-2xl"
        style={{
          width: `${size * 2}px`,
          height: `${size * 2}px`,
        }}
      >
        {/* Círculo pulsante para efecto visual */}
        <div
          className="absolute rounded-full border-4 border-blue-700 animate-pulse-slow"
          style={{
            width: `${size * 1.8}px`,
            height: `${size * 1.8}px`,
          }}
        ></div>

        {/* Monitor cardíaco animado */}
        <svg
          className="absolute animate-cardiograma"
          viewBox="0 0 100 100"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: `${size * 1.6}px`,
            height: `${size * 1.6}px`,
          }}
        >
          <path
            d="M 0 50 L 10 60 L 25 20 L 40 80 L 55 15 L 70 90 L 85 40 L 100 50"
            stroke="rgba(50, 220, 250, 0.9)"
          />
        </svg>

        {/* Anillos rotatorios para efecto dinámico */}
        <div
          className="absolute rounded-full border-2 border-blue-500 animate-rotate-slow"
          style={{
            width: `${size * 2}px`,
            height: `${size * 2}px`,
          }}
        ></div>
      </div>

      {/* Estilos del Loader */}
      <style jsx>{`
        @keyframes fancyCardiograma {
          0% {
            stroke-dashoffset: 500;
            stroke: rgba(50, 200, 250, 0.9);
            transform: scaleY(1);
          }
          20% {
            stroke: rgba(100, 230, 255, 1);
            transform: scaleY(1.3);
          }
          40% {
            stroke: rgba(50, 180, 240, 0.7);
            transform: scaleY(0.8);
          }
          60% {
            stroke: rgba(70, 230, 255, 1);
            transform: scaleY(1.5);
          }
          80% {
            stroke: rgba(50, 200, 250, 0.9);
            transform: scaleY(1);
          }
          100% {
            stroke-dashoffset: 0;
            stroke: rgba(70, 230, 255, 1);
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

        @keyframes fade {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
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

        .animate-fade {
          animation: fade 2.5s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;
