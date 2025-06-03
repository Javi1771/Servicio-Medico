/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  //! Actualiza el estado cuando ocurre un error
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  //* Puedes registrar el error en un servicio de logging
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  // Función para recargar la página
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 px-4">
          <div className="max-w-md w-full bg-[#FF2323]/10 border border-[#FF2323] rounded-xl p-6 flex flex-col items-center animate-pulse-slow">
            {/* Icono de advertencia */}
            <FaExclamationTriangle className="text-[#D70000] text-5xl mb-4" />

            {/* Título */}
            <h1 className="text-2xl font-semibold text-[#B10303] mb-2 text-center">
              Algo salió mal
            </h1>

            {/* Mensaje descriptivo */}
            <p className="text-sm text-[#920A0A] text-center mb-6">
              Ha ocurrido un error inesperado. Intenta recargar o regresa más
              tarde.
            </p>

            {/* Botón de recargar */}
            <button
              onClick={this.handleReload}
              className="
                bg-[#FF2323] 
                hover:bg-[#D70000] 
                text-white 
                font-medium 
                py-2 
                px-4 
                rounded-lg 
                transition-colors 
                focus:outline-none 
                focus:ring-2 
                focus:ring-[#FF2323]/50
              "
            >
              Recargar
            </button>
          </div>

          {/* Animaciones definidas en style jsx */}
          <style jsx>{`
            @keyframes pulseSlow {
              0% {
                transform: scale(0.97);
                opacity: 0.9;
              }
              50% {
                transform: scale(1);
                opacity: 1;
              }
              100% {
                transform: scale(0.97);
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
