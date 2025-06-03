/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 z-50">
          <div className="max-w-md w-full bg-red-900 border border-red-700 rounded-xl p-8 flex flex-col items-center shadow-2xl animate-pulse-slow">
            {/* Icono de advertencia */}
            <FaExclamationTriangle className="text-white text-6xl mb-6" />

            {/* Título */}
            <h1 className="text-3xl font-bold text-white mb-3 text-center">
              Algo salió mal
            </h1>

            {/* Mensaje descriptivo */}
            <p className="text-base text-red-200 text-center mb-8">
              Ha ocurrido un error inesperado. Intenta recargar la página o regresa más tarde.
            </p>

            {/* Botón de recargar */}
            <button
              onClick={this.handleReload}
              className="
                bg-white 
                text-red-900 
                font-semibold 
                py-3 
                px-8 
                rounded-lg 
                hover:bg-red-100 
                transition-colors 
                focus:outline-none 
                focus:ring-2 
                focus:ring-white/50
              "
            >
              Recargar página
            </button>
          </div>

          {/* Animación de pulso lenta */}
          <style jsx>{`
            @keyframes pulseSlow {
              0% {
                transform: scale(0.98);
                opacity: 0.9;
              }
              50% {
                transform: scale(1);
                opacity: 1;
              }
              100% {
                transform: scale(0.98);
                opacity: 0.9;
              }
            }
            .animate-pulse-slow {
              animation: pulseSlow 2s ease-in-out infinite;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
