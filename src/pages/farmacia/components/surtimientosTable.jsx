import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

import SurtimientosInfo from "./surtimientosInfo";
import MedicamentosList from "./medicamentosList";
import { showCustomAlert } from "../../../utils/alertas";

//* Función para validar EAN
async function validarEAN(ean, claveMedicamento) {
  try {
    const resp = await fetch("/api/farmacia/validarEAN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, claveMedicamento }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || "Error validando EAN");
    return data; //! { valido: true/false }
  } catch (err) {
    console.error(err);
    return { valido: false };
  }
}

const SurtimientosTable = ({ data, resetSurtimiento }) => {
  const { surtimiento, detalleSurtimientos } = data;
  const [cost, setCost] = useState(surtimiento?.COSTO || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detalle, setDetalle] = useState(
    detalleSurtimientos.map((item) => ({
      ...item,
      delivered: item.entregado || 0, //* Total entregado previamente
      showInput: false,
      eanValue: "",
      estatusLocal: (item.entregado || 0) >= item.piezas ? 2 : 1,
      stock: item.stock !== undefined ? item.stock : item.piezas,
    }))
  );

  //* Toggle para el input EAN
  const toggleInput = (idSurt) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt ? { ...it, showInput: !it.showInput } : it
      )
    );
  };

  //* Manejar cambio del EAN
  const handleEANChange = (idSurt, value) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt ? { ...it, eanValue: value } : it
      )
    );
  };

  const handleAceptarEAN = async (idSurt, eanValue) => {
    const item = detalle.find((it) => it.idSurtimiento === idSurt);
    if (!item) return;

    const pendiente = item.piezas - item.delivered;
    if (pendiente <= 0) {
      await showCustomAlert(
        "info",
        "Todas las piezas entregadas",
        "Ya se han entregado todas las piezas requeridas.",
        "Aceptar"
      );

      return;
    }

    if (item.stock === 0) {
      await showCustomAlert(
        "error",
        "Sin Stock",
        "No hay unidades disponibles en stock.",
        "Aceptar"
      );

      return;
    }

    if (item.delivered >= item.stock) {
      await showCustomAlert(
        "warning",
        "Límite de Stock Alcanzado",
        `El máximo permitido es ${item.stock} piezas.`,
        "Aceptar"
      );

      return;
    }

    const { valido } = await validarEAN(eanValue, item.claveMedicamento);
    if (!valido) {
      await showCustomAlert(
        "error",
        "EAN no válido",
        "El EAN escaneado no coincide.",
        "Aceptar"
      );

      return;
    }

    const newDelivered = item.delivered + 1;
    if (newDelivered > item.stock) {
      await showCustomAlert(
        "warning",
        "Stock insuficiente",
        `El máximo permitido es ${item.stock} piezas.`,
        "Aceptar"
      );

      return;
    }

    const nuevoEstatusLocal = newDelivered >= item.piezas ? 2 : 1;

    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt
          ? {
              ...it,
              delivered: newDelivered,
              eanValue: "",
              estatusLocal: nuevoEstatusLocal,
              showInput: false,
            }
          : it
      )
    );
  };

  //* Guardar: calcular delta por cada detalle
  const handleGuardar = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const detallesParaGuardar = detalle
      .map((it) => {
        const delta = it.delivered - it.entregado;
        return {
          idSurtimiento: it.idSurtimiento,
          delivered: it.delivered,
          delta,
          claveMedicamento: it.claveMedicamento,
          estatus: it.estatusLocal,
          piezas: it.piezas,
        };
      })
      .filter((it) => it.delta > 0);

    if (detallesParaGuardar.length === 0) {
      await showCustomAlert(
        "info",
        "Sin cambios",
        "No hay nuevas piezas escaneadas.",
        "Aceptar"
      );

      resetSurtimiento();
      setIsSubmitting(false);
      return;
    }

    const recetaCompletada = detalle.every((it) => it.delivered >= it.piezas);
    const now = new Date();
    const fechaDespacho = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    try {
      await fetch("/api/farmacia/surtirMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folioSurtimiento: surtimiento.FOLIO_SURTIMIENTO,
          detalle: detallesParaGuardar,
          recetaCompletada,
          fechaDespacho,
          cost,
        }),
      });

      await showCustomAlert(
        "success",
        "Éxito",
        "Cambios guardados correctamente.",
        "Aceptar"
      );

      resetSurtimiento();
    } catch (err) {
      console.error("Error al guardar:", err);
      await showCustomAlert(
        "error",
        "Error",
        "Hubo un problema al guardar los cambios. Intenta nuevamente.",
        "Aceptar"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    //* Contenedor principal con Tailwind: fondo degradado, pantalla completa
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-cyan-400 p-8 relative rounded-3xl border-4 border-white">
      {/* Contenedor interno con fondo blanco, sombra */}
      <div className="relative w-full max-w-5xl p-6 bg-white rounded-lg shadow-xl z-10">
        {/* Título (opcional) */}
        <h1 className="text-2xl font-bold text-gray-700 mb-4">
          Surtimiento de Medicamentos
        </h1>

        {/* Componentes */}
        <SurtimientosInfo
          surtimiento={surtimiento}
          cost={cost}
          setCost={setCost}
        />
        <MedicamentosList
          detalle={detalle}
          toggleInput={toggleInput}
          handleEANChange={handleEANChange}
          handleAceptarEAN={handleAceptarEAN}
        />

        {/* Botón de Guardar */}
        <button
          onClick={handleGuardar}
          disabled={isSubmitting}
          className={`mt-6 px-6 py-2 bg-cyan-600 text-white font-semibold rounded shadow-md flex items-center justify-center transition ${
            isSubmitting
              ? "opacity-50 cursor-wait"
              : "hover:shadow-lg hover:scale-105"
          }`}
        >
          {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
};

export default SurtimientosTable;
