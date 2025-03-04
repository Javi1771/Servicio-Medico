import React, { useState, useRef } from "react";

const MedicamentosList = ({
  detalle,
  toggleInput,
  handleEANChange,
  handleAceptarEAN,
}) => {
  const [scanTimeouts, setScanTimeouts] = useState({});
  const inputRefs = useRef({}); // Guarda referencias a los inputs para hacer focus automático

  // Función para renderizar una tarjeta de medicamento
  const renderMedicamentoCard = (item) => {
    const pendiente = item.piezas - item.delivered;

    return (
      <div
        key={item.idSurtimiento}
        className="
          relative p-4 rounded-lg overflow-hidden 
          transition-transform 
          hover:-translate-y-2 hover:scale-[1.04] 
          hover:shadow-[0_0_8px_#fff,0_0_20px_#fff,0_0_30px_rgba(255,0,255,0.7),0_0_40px_rgba(255,0,255,0.7)]
          shadow-md
        "
        style={{
          background: "linear-gradient(135deg, #00eaff, #0095ff)",
        }}
      >
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.35),rgba(0,0,0,0.5))] z-0" />

        {/* Burbujas decorativas */}
        <div className="bubbleContainer pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="bubble" style={{ top: "10%", left: "20%" }} />
          <div className="bubble" style={{ top: "50%", left: "70%" }} />
          <div className="bubble" style={{ top: "80%", left: "30%" }} />
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 text-white space-y-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-pills" />
            <span className="font-semibold">Medicamento:</span>
            <span>{item.nombreMedicamento || item.claveMedicamento}</span>
          </div>

          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-boxes-stacked" />
            <span className="font-semibold">Cantidad:</span>
            <span>{item.cantidad}</span>
          </div>

          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-cubes" />
            <span className="font-semibold">Piezas por entregar:</span>
            <span>{item.piezas}</span>
          </div>

          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-check" />
            <span className="font-semibold">Entregado:</span>
            <span>{item.delivered}</span>
          </div>

          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-clock" />
            <span className="font-semibold">Pendiente:</span>
            <span>{pendiente}</span>
          </div>

          {/* Botón Escanear EAN */}
          <button
            onClick={() => {
              toggleInput(item.idSurtimiento);
              setTimeout(() => {
                if (inputRefs.current[item.idSurtimiento]) {
                  inputRefs.current[item.idSurtimiento].focus();
                }
              }, 100);
            }}
            disabled={pendiente <= 0}
            className={`
              mt-1 px-4 py-2 rounded-md font-semibold transition-transform 
              ${
                pendiente <= 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
              }
            `}
          >
            {item.showInput ? "Ocultar" : "Escanear EAN"}
          </button>

          {/* Input EAN */}
          {item.showInput && (
            <div className="flex flex-col space-y-2 mt-2">
              <input
                ref={(el) => (inputRefs.current[item.idSurtimiento] = el)}
                type="text"
                placeholder="Escanea el EAN"
                value={item.eanValue || ""}
                onChange={(e) => {
                  const ean = e.target.value.trim();
                  handleEANChange(item.idSurtimiento, ean);

                  // Cancelar timeout previo
                  if (scanTimeouts[item.idSurtimiento]) {
                    clearTimeout(scanTimeouts[item.idSurtimiento]);
                  }

                  // Espera 500ms tras el último dígito
                  const newTimeout = setTimeout(() => {
                    if (/^\d{8,13}$/.test(ean)) {
                      handleAceptarEAN(item.idSurtimiento, ean);
                      handleEANChange(item.idSurtimiento, "");
                      setTimeout(() => {
                        if (inputRefs.current[item.idSurtimiento]) {
                          inputRefs.current[item.idSurtimiento].focus();
                        }
                      }, 100);
                    }
                  }, 500);

                  setScanTimeouts((prev) => ({
                    ...prev,
                    [item.idSurtimiento]: newTimeout,
                  }));
                }}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                autoFocus
              />
              <small className="text-white opacity-90">
                Ingresa o escanea el código EAN (8-13 dígitos).
              </small>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Caso 1: No hay detalle
  if (!detalle || detalle.length === 0) {
    return (
      <div className="p-4 mt-4 bg-white rounded-md shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Detalle de Medicamentos
        </h2>
        <p className="text-gray-600 text-center">
          No se encontró detalle de medicamentos.
        </p>
      </div>
    );
  }

  // Caso 2: Hay un solo medicamento
  if (detalle.length === 1) {
    return (
      <div className="p-4 mt-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Detalle de Medicamentos
        </h2>
        {/* max-w-4xl y mx-auto para centrar */}
        <div className="max-w-4xl mx-auto">{renderMedicamentoCard(detalle[0])}</div>
      </div>
    );
  }

  // Caso 3: Hay 2 medicamentos
  if (detalle.length === 2) {
    return (
      <div className="p-4 mt-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Detalle de Medicamentos
        </h2>
        {/* 2 columnas fijas para dos medicamentos */}
        <div className="grid gap-6 grid-cols-2">
          {detalle.map((item) => renderMedicamentoCard(item))}
        </div>
        <style jsx>{`
          .bubbleContainer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
          }
          .bubble {
            position: absolute;
            width: 25px;
            height: 25px;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            animation: bubble 4s infinite ease-in-out;
          }
          @keyframes bubble {
            0% {
              transform: translateY(0) scale(1);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-20px) scale(1.2);
              opacity: 0.4;
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  // Caso 4: 3 o más medicamentos
  return (
    <div className="p-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Detalle de Medicamentos
      </h2>
      {/* Para 3 o más, usaremos 2 columnas en md, 3 en xl */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {detalle.map((item) => renderMedicamentoCard(item))}
      </div>

      <style jsx>{`
        .bubbleContainer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        .bubble {
          position: absolute;
          width: 25px;
          height: 25px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          animation: bubble 4s infinite ease-in-out;
        }
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicamentosList;
