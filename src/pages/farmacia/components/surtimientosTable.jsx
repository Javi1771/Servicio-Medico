import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

import SurtimientosInfo from "./surtimientosInfo";
import MedicamentosList from "./medicamentosList";

const MySwal = withReactContent(Swal);

//* Define las rutas de los sonidos de éxito y error
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

//! Reproduce un sonido de éxito/error
const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

//* 🔹 Función para validar el EAN
async function validarEAN(ean, claveMedicamento) {
  try {
    const resp = await fetch("/api/farmacia/validarEAN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, claveMedicamento }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || "Error validando EAN");
    return data; //* { valido: true/false }
  } catch (err) {
    console.error(err);
    return { valido: false };
  }
}

const SurtimientosTable = ({ data, resetSurtimiento }) => {
  const { surtimiento, detalleSurtimientos } = data;
  const [cost, setCost] = useState(surtimiento?.COSTO || "");
  const [detalle, setDetalle] = useState(
    detalleSurtimientos.map((item) => ({
      ...item,
      delivered: item.entregado || 0, //* 🔹 Total entregado previamente
      showInput: false,
      eanValue: "",
      estatusLocal: (item.entregado || 0) >= item.piezas ? 2 : 1,
      stock: item.stock !== undefined ? item.stock : item.piezas,
    }))
  );

  //* 🔹 Toggle del input EAN
  const toggleInput = (idSurt) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt ? { ...it, showInput: !it.showInput } : it
      )
    );
  };

  //* 🔹 Manejar cambio de EAN
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

    console.log("📌 Intentando validar EAN:", eanValue);
    console.log("📌 Clave Medicamento:", item.claveMedicamento);

    const pendiente = item.piezas - item.delivered; //* 🔹 Piezas realmente pendientes
    console.log("📌 Piezas pendientes por entregar:", pendiente);
    console.log("📌 Stock disponible:", item.stock);

    if (pendiente <= 0) {
      playSound(false);
      MySwal.fire({
        icon: "info",
        title:
          "<span style='color: #00bcd4;'>⚠️ Todas las piezas entregadas</span>",
        html: "<p style='color: #fff;'>Ya se han entregado todas las piezas requeridas para este medicamento.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00bcd4",
        customClass: {
          popup:
            "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
        },
      });
      return;
    }

    if (item.stock === 0) {
      playSound(false);
      MySwal.fire({
        icon: "error",
        title: "<span style='color: #ff1744;'>❌ Sin Stock</span>",
        html: "<p style='color: #fff;'>No hay más unidades disponibles en stock para este medicamento.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      return; //* 🔹 Bloquea la entrega si el stock es 0
    }

    if (item.delivered >= item.stock) {
      playSound(false);
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ff9800;'>⚠️ Límite de Stock Alcanzado</span>",
        html: `<p style='color: #fff;'>Ya se han entregado todas las piezas disponibles en stock (${item.stock}).</p>`,
        background: "linear-gradient(145deg, #4a2600, #220f00)",
        confirmButtonColor: "#ff9800",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_25px_5px_rgba(255,152,0,0.9)] rounded-lg",
        },
      });
      return; //* 🔹 Bloquea la entrega si ya se llegó al máximo del stock
    }

    const { valido } = await validarEAN(eanValue, item.claveMedicamento);
    console.log("📌 Resultado de validarEAN:", valido);

    if (!valido) {
      playSound(false);
      MySwal.fire({
        icon: "error",
        title: "<span style='color: #ff1744;'>❌ EAN no válido</span>",
        html: "<p style='color: #fff;'>El código EAN escaneado no coincide con el medicamento.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      return;
    }

    //* 🔹 Si todo es correcto, incrementar el número de entregados
    const newDelivered = item.delivered + 1;

    if (newDelivered > item.stock) {
      playSound(false);
      MySwal.fire({
        icon: "warning",
        title:
          "<span style='color: #ff9800;'>⚠️ No puedes entregar más de lo que hay en stock</span>",
        html: `<p style='color: #fff;'>El máximo permitido es ${item.stock} piezas.</p>`,
        background: "linear-gradient(145deg, #4a2600, #220f00)",
        confirmButtonColor: "#ff9800",
        customClass: {
          popup:
            "border border-yellow-600 shadow-[0px_0px_25px_5px_rgba(255,152,0,0.9)] rounded-lg",
        },
      });
      return; //* 🔹 Evita entregar más piezas que el stock disponible
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

  //* Guardar: se calculará el delta para cada detalle
  const handleGuardar = async () => {
    const detallesParaGuardar = detalle
      .map((it) => {
        const delta = it.delivered - it.entregado; //* 🔹 Solo descontar lo nuevo

        return {
          idSurtimiento: it.idSurtimiento,
          delivered: it.delivered,
          delta,
          claveMedicamento: it.claveMedicamento,
          estatus: it.estatusLocal,
          piezas: it.piezas,
        };
      })
      .filter((it) => it.delta > 0); //* 🔹 Solo enviar cambios si hubo nuevos escaneos

    //!🔹 Evitar guardar si no hay cambios
    if (detallesParaGuardar.length === 0) {
      playSound(false);
      MySwal.fire({
        icon: "info",
        title: "<span style='color: #00bcd4;'>ℹ️ Sin cambios</span>",
        html: "<p style='color: #fff;'>No se han escaneado nuevas piezas. No hay nada que guardar.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00bcd4",
        customClass: {
          popup:
            "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
        },
      }).then(() => {
        //* Al pulsar OK se limpia la pantalla
        resetSurtimiento();
      });
      return;
    }

    //* 🔹 Determinar si la receta está completamente surtida
    const recetaCompletada = detalle.every((it) => it.delivered >= it.piezas);

    const now = new Date();
    const fechaDespacho = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    console.log("📌 Fecha Despacho Generada:", fechaDespacho);

    try {
      console.log("📌 Enviando datos al backend:");
      console.log("   🔹 Folio Surtimiento:", surtimiento.FOLIO_SURTIMIENTO);
      console.log("   🔹 Receta Completada:", recetaCompletada);
      console.log("   🔹 Fecha Despacho:", fechaDespacho);
      console.log("   🔹 Detalles a actualizar:", detallesParaGuardar);

      await fetch("/api/farmacia/surtirMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folioSurtimiento: surtimiento.FOLIO_SURTIMIENTO,
          detalle: detallesParaGuardar,
          recetaCompletada, //* 🔹 Ahora se envía correctamente
          fechaDespacho, //* 🔹 Se envía la fecha de despacho
          cost, //* 🔹 Se envía el costo
        }),
      });

      playSound(true);
      MySwal.fire({
        icon: "success",
        title: "<span style='color: #00e676;'>✔️ Éxito</span>",
        html: "<p style='color: #fff;'>Cambios guardados correctamente.</p>",
        background: "linear-gradient(145deg, #003300, #001a00)",
        confirmButtonColor: "#00e676",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_25px_5px_rgba(0,255,118,0.7)] rounded-lg",
        },
      });

      //* 🔹 Limpia la pantalla después de guardar
      resetSurtimiento();
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title: "<span style='color: #ff1744;'>❌ Error</span>",
        html: "<p style='color: #fff;'>Hubo un problema al guardar los cambios. Intenta nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    }
  };

  return (
    <div>
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
      <button onClick={handleGuardar} className={styles.saveButton}>
        Guardar
      </button>
    </div>
  );
};

export default SurtimientosTable;
