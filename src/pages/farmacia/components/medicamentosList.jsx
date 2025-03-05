import React, { useState, useRef } from "react";
import {
  FaClipboardList,
  FaPills,
  FaBoxes,
  FaCubes,
  FaCheck,
  FaClock,
  FaBarcode,
} from "react-icons/fa";

const MedicamentosList = ({ detalle, handleEANChange, handleAceptarEAN }) => {
  const [scanTimeouts, setScanTimeouts] = useState({});
  const inputRefs = useRef({});
  //* Nuevo estado para controlar si el input ya se abrió
  const [inputOpen, setInputOpen] = useState({});

  //* Función para abrir el input de forma permanente para un producto
  const openInput = (id) => {
    setInputOpen((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      if (inputRefs.current[id]) {
        inputRefs.current[id].focus();
      }
    }, 100);
  };

  //* Renderiza una tarjeta de medicamento
  const renderMedicamentoCard = (item) => {
    const pendiente = item.piezas - item.delivered;

    return (
      <div
        key={item.idSurtimiento}
        className="
          relative flex flex-col w-full 
          bg-white rounded-lg shadow 
          border border-gray-200
          transition 
          hover:shadow-lg
          overflow-hidden
        "
      >
        {/* Encabezado en azul */}
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
          <FaClipboardList className="text-xl" />
          <h3 className="text-lg font-bold">Medicamento</h3>
        </div>

        {/* Contenido principal */}
        <div className="p-4 text-gray-700 space-y-3">
          <div className="flex items-center gap-2">
            <FaPills className="text-blue-600" />
            <span className="font-semibold">Medicamento:</span>
            <span>{item.nombreMedicamento || item.claveMedicamento}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaBoxes className="text-blue-600" />
            <span className="font-semibold">Indicaciones:</span>
            <span>{item.cantidad}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaCubes className="text-blue-600" />
            <span className="font-semibold">Piezas por entregar:</span>
            <span>{item.piezas}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaCheck className="text-blue-600" />
            <span className="font-semibold">Entregado:</span>
            <span>{item.delivered}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaClock className="text-blue-600" />
            <span className="font-semibold">Pendiente:</span>
            <span>{pendiente}</span>
          </div>

          {/* Botón para enfocar (o abrir) el input */}
          <button
            onClick={() => {
              //* Si ya está abierto, solo enfoca; si no, lo abre
              if (inputOpen[item.idSurtimiento]) {
                if (inputRefs.current[item.idSurtimiento]) {
                  inputRefs.current[item.idSurtimiento].focus();
                }
              } else {
                openInput(item.idSurtimiento);
              }
            }}
            disabled={pendiente <= 0}
            className={`
              mt-2 px-4 py-2 rounded-md font-semibold inline-flex items-center gap-2
              transition-transform
              ${
                pendiente <= 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
              }
            `}
          >
            <FaBarcode />
            Escanear EAN
          </button>

          {/* Input EAN, que se mantiene abierto una vez activado */}
          {item.showInput || inputOpen[item.idSurtimiento] ? (
            <div className="flex flex-col gap-2 mt-2">
              <input
                ref={(el) => (inputRefs.current[item.idSurtimiento] = el)}
                type="text"
                placeholder="Escanea el EAN"
                value={item.eanValue || ""}
                onChange={(e) => {
                  const ean = e.target.value.trim();
                  handleEANChange(item.idSurtimiento, ean);

                  if (scanTimeouts[item.idSurtimiento]) {
                    clearTimeout(scanTimeouts[item.idSurtimiento]);
                  }

                  const newTimeout = setTimeout(() => {
                    //* Ahora validamos con cualquier cantidad de dígitos
                    if (/^\d+$/.test(ean)) {
                      handleAceptarEAN(item.idSurtimiento, ean);
                      //* Limpia el input para continuar escaneando sin cerrar
                      handleEANChange(item.idSurtimiento, "");
                      if (inputRefs.current[item.idSurtimiento]) {
                        inputRefs.current[item.idSurtimiento].focus();
                      }
                    }
                  }, 500);

                  setScanTimeouts((prev) => ({
                    ...prev,
                    [item.idSurtimiento]: newTimeout,
                  }));
                }}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                autoFocus
              />
              <small className="text-gray-600">
                Ingresa o escanea el código EAN (cualquier cantidad de dígitos).
              </small>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

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

  if (detalle.length === 1) {
    return (
      <div className="p-4 mt-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Detalle de Medicamentos
        </h2>
        <div className="max-w-4xl mx-auto">
          {renderMedicamentoCard(detalle[0])}
        </div>
      </div>
    );
  }

  if (detalle.length === 2) {
    return (
      <div className="p-4 mt-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Detalle de Medicamentos
        </h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {detalle.map((item) => renderMedicamentoCard(item))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Detalle de Medicamentos
      </h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {detalle.map((item) => renderMedicamentoCard(item))}
      </div>
    </div>
  );
};

export default MedicamentosList;
