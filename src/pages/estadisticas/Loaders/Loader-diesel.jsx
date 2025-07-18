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
      {/* Contenedor principal del monitor cardíaco */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-br from-[#FFF0F0] via-[#FFC17E] to-[#FF5757] p-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
        style={{
          width: `${size * 2.1}px`,
          height: `${size * 2.1}px`,
        }}
      >
        {/* Círculo pulsante para efecto visual */}
        <div
          className="absolute rounded-full border-4 border-[#FF2323] animate-pulse-slow"
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
            stroke="rgba(222, 49, 0, 1)" /* Diesel 600 (#DE3100) */
          />
        </svg>

        {/* Anillos rotatorios para efecto dinámico */}
        <div
          className="absolute rounded-full border-2 border-[#B01900] animate-rotate-slow"
          style={{
            width: `${size * 2.4}px`,
            height: `${size * 2.4}px`,
          }}
        ></div>
      </div>

      {/* Estilos del Loader */}
      <style jsx>{`
        @keyframes fancyCardiograma {
          0% {
            stroke-dashoffset: 500;
            stroke: rgba(222, 49, 0, 1); /* Diesel 600 */
            transform: scaleY(1);
          }
          20% {
            stroke: rgba(255, 35, 35, 1); /* Red 500 (#FF2323) */
            transform: scaleY(1.3);
          }
          40% {
            stroke: rgba(176, 19, 0, 0.9); /* Diesel 700 (#B01900) */
            transform: scaleY(0.8);
          }
          60% {
            stroke: rgba(222, 49, 0, 1); /* Diesel 600 */
            transform: scaleY(1.5);
          }
          80% {
            stroke: rgba(255, 35, 35, 1); /* Red 500 */
            transform: scaleY(1);
          }
          100% {
            stroke-dashoffset: 0;
            stroke: rgba(222, 49, 0, 1); /* Diesel 600 */
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
            transform: scale(1.2);
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
