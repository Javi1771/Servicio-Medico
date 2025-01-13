import React, { useEffect, useState } from "react";

const Loader = ({ size = 30, duration = 10000 }) => {
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
      {/* Texto superior */}
      <p
        className="text-2xl font-bold tracking-wide text-teal-300 uppercase"
        style={{ fontSize: `${size / 3.5}px` }}
      >
      </p>

      {/* Texto cargando */}
      <p
        className="text-4xl font-extrabold tracking-wider text-teal-400 uppercase animate-gradient-text"
        style={{ fontSize: `${size / 4}px` }}
      >
      </p>

      {/* Contenedor principal del monitor cardíaco */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-800 to-black p-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
        style={{
          width: `${size * 2.1}px`,
          height: `${size * 2.1}px`,
        }}
      >
        {/* Círculo pulsante para efecto visual */}
        <div
          className="absolute rounded-full border-4 border-teal-500 animate-pulse-slow"
          style={{
            width: `${size * 2.6}px`,
            height: `${size * 2.6}px`,
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
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
          }}
        >
          <path
            d="M 0 50 L 10 60 L 25 20 L 40 80 L 55 15 L 70 90 L 85 40 L 100 50"
            stroke="rgba(50, 220, 250, 0.9)"
          />
        </svg>

        {/* Anillos rotatorios para efecto dinámico */}
        <div
          className="absolute rounded-full border-2 border-teal-400 animate-rotate-slow"
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

        .animate-gradient-text {
          background: linear-gradient(90deg, #4ca1af, #c4e0e5);
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
