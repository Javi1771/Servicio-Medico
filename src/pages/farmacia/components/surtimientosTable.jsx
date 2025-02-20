// pages/farmacia/components/SurtimientosTable.jsx
import React, { useState } from "react";
import Head from "next/head";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

import SurtimientosInfo from "./surtimientosInfo";
import MedicamentosList from "./medicamentosList";

// Función para validar el EAN (puede estar aquí o importarlo de un helper)
async function validarEAN(ean, claveMedicamento) {
  try {
    const resp = await fetch("/api/farmacia/validarEAN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, claveMedicamento }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || "Error validando EAN");
    return data; // { valido: true/false }
  } catch (err) {
    console.error(err);
    return { valido: false };
  }
}

const SurtimientosTable = ({ data }) => {
  const { surtimiento, detalleSurtimientos } = data;

  // Estado para el costo (si la receta sigue pendiente, podemos editarlo)
  const [cost, setCost] = useState(surtimiento?.COSTO || "");

  // Inicializamos la lista de medicamentos
  const [detalle, setDetalle] = useState(
    detalleSurtimientos.map((item) => ({
      ...item,
      delivered: item.entregado || 0,
      showInput: false,
      eanValue: "",
      estatusLocal: (item.entregado || 0) >= item.piezas ? 2 : 1,
    }))
  );

  // Toggle del input EAN
  const toggleInput = (idSurt) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt
          ? { ...it, showInput: !it.showInput }
          : it
      )
    );
  };

  // Manejar cambio de EAN
  const handleEANChange = (idSurt, value) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt ? { ...it, eanValue: value } : it
      )
    );
  };

  // Aceptar EAN (entregar 1 pieza)
  const handleAceptarEAN = async (idSurt) => {
    const item = detalle.find((it) => it.idSurtimiento === idSurt);
    if (!item) return;

    const pending = item.piezas - item.delivered;
    if (pending <= 0) {
      alert("Ya se han entregado todas las piezas requeridas para este medicamento.");
      return;
    }

    // Permitir escanear mientras delivered < item.stock
    if (item.delivered >= item.stock) {
      alert(
        `Stock insuficiente para este medicamento.
         Solo se pueden entregar ${item.stock} piezas en total.`
      );
      return;
    }

    // Validar EAN
    const { valido } = await validarEAN(item.eanValue, item.claveMedicamento);
    if (!valido) {
      alert("EAN no válido o no coincide con el medicamento.");
      return;
    }

    // Aumentar delivered
    const newDelivered = item.delivered + 1;
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

  // Guardar
  const handleGuardar = async () => {
    try {
      const todosSurtidos = detalle.every((it) => it.estatusLocal === 2);

      const detallesParaGuardar = detalle.map((it) => ({
        idSurtimiento: it.idSurtimiento,
        delivered: it.delivered,
        claveMedicamento: it.claveMedicamento,
        estatus: it.estatusLocal,
      }));

      let finalCost = cost;

      // Si la receta se completó y la BD dice ESTATUS=1 => pedimos costo
      if (todosSurtidos && surtimiento.ESTATUS === 1) {
        if (!finalCost || finalCost.toString().trim() === "") {
          const confirmar = confirm(
            "No se ingresó costo. ¿Deseas continuar con costo = $0?"
          );
          if (!confirmar) {
            return; // Cancela la transacción
          } else {
            finalCost = 0;
          }
        }
      }

      // Llamada al backend
      const resp = await fetch("/api/farmacia/surtirMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folioSurtimiento: surtimiento.FOLIO_SURTIMIENTO,
          detalle: detallesParaGuardar,
          recetaCompletada: todosSurtidos,
          cost: finalCost,
        }),
      });

      const dataResp = await resp.json();
      if (!resp.ok) throw new Error(dataResp.message || "Error al guardar");
      alert("Cambios guardados correctamente.");

      // location.reload();
    } catch (err) {
      alert("Error guardando cambios: " + err.message);
    }
  };

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          integrity="sha384-..."
          crossOrigin="anonymous"
        />
      </Head>
      <div className={styles.card}>
        <div className={styles.dualContainer}>
          {/* Información del Surtimiento */}
          <SurtimientosInfo surtimiento={surtimiento} cost={cost} setCost={setCost} />

          {/* Lista de Medicamentos */}
          <MedicamentosList
            detalle={detalle}
            toggleInput={toggleInput}
            handleEANChange={handleEANChange}
            handleAceptarEAN={handleAceptarEAN}
          />

          {/* Botón Guardar */}
          <button onClick={handleGuardar} className={styles.saveButton}>
            Guardar
          </button>
        </div>
      </div>
    </>
  );
};

export default SurtimientosTable;
