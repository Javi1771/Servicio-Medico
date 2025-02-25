// pages/farmacia/components/SurtimientosTable.jsx
import React, { useState } from "react";
import Head from "next/head";
import Swal from "sweetalert2";
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
  const [cost, setCost] = useState(surtimiento?.COSTO || "");
  const [detalle, setDetalle] = useState(
    detalleSurtimientos.map((item) => ({
      ...item,
      delivered: item.entregado || 0,
      alreadyDiscounted: item.alreadyDiscounted || 0,
      showInput: false,
      eanValue: "",
      estatusLocal: (item.entregado || 0) >= item.piezas ? 2 : 1,
      stock: item.stock !== undefined ? item.stock : item.piezas,
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
    if (item.delivered >= item.stock) {
      alert(`Stock insuficiente para este medicamento.
Solo se pueden entregar ${item.stock} piezas en total.`);
      return;
    }
    const { valido } = await validarEAN(item.eanValue, item.claveMedicamento);
    if (!valido) {
      alert("EAN no válido o no coincide con el medicamento.");
      return;
    }
    const newDelivered = item.delivered + 1;
    const nuevoEstatusLocal = newDelivered >= item.piezas ? 2 : 1;
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt
          ? { ...it, delivered: newDelivered, eanValue: "", estatusLocal: nuevoEstatusLocal, showInput: false }
          : it
      )
    );
  };

  // Guardar: se calculará el delta para cada detalle
  const handleGuardar = async () => {
    const detallesParaGuardar = detalle.map((it) => {
      const delta = it.delivered - it.alreadyDiscounted;
      return {
        idSurtimiento: it.idSurtimiento,
        delivered: it.delivered,
        delta,
        claveMedicamento: it.claveMedicamento,
        estatus: it.estatusLocal,
        piezas: it.piezas,
      };
    });
    const todosSurtidos = detalle.every((it) => it.delivered >= it.piezas);
    let finalCost = cost;
    if (todosSurtidos && surtimiento.ESTATUS === 1) {
      if (!finalCost || finalCost.toString().trim() === "") {
        const confirmar = confirm("No se ingresó costo. ¿Deseas continuar con costo = $0?");
        if (!confirmar) return;
        finalCost = 0;
      }
    }
    try {
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
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Cambios guardados correctamente.",
      });
      setDetalle((prev) =>
        prev.map((it) => ({ ...it, alreadyDiscounted: it.delivered }))
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error guardando cambios: " + err.message,
      });
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
          <SurtimientosInfo surtimiento={surtimiento} cost={cost} setCost={setCost} />
          <MedicamentosList
            detalle={detalle}
            toggleInput={toggleInput}
            handleEANChange={handleEANChange}
            handleAceptarEAN={handleAceptarEAN}
          />
          <button onClick={handleGuardar} className={styles.saveButton}>
            Guardar
          </button>
        </div>
      </div>
    </>
  );
};

export default SurtimientosTable;
