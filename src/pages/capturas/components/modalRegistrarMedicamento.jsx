import React, { useState } from "react";
import styles from "../../css/estilosSurtimientos/modal.module.css";
import Swal from "sweetalert2";
import ReactDOM from "react-dom";

export default function ModalRegistrarMedicamento({ isOpen, onClose, onSave }) {
  const [medicamentoNombre, setMedicamentoNombre] = useState("");
  const [clasificacion, setClasificacion] = useState("");

  if (!isOpen) return null;

  //* Define las rutas de los sonidos de éxito y error
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  const handleSave = () => {
    if (!medicamentoNombre || !clasificacion) {
      playSound(false);
      Swal.fire({
        title: "Error",
        text: "Por favor completa todos los campos.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    // Envía los valores al método `onSave`
    onSave(medicamentoNombre, clasificacion);
    onClose(); // Cierra el modal
  };

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Registrar Nuevo Medicamento</h2>
        <div className={styles.formGroup}>
          <label htmlFor="medicamentoNombre" className={styles.label}>
            Nombre del Medicamento:
          </label>
          <input
            id="medicamentoNombre"
            type="text"
            placeholder="Escribe el nombre del medicamento"
            className={styles.input}
            value={medicamentoNombre}
            onChange={(e) => setMedicamentoNombre(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="clasificacion" className={styles.label}>
            Clasificación:
          </label>
          <select
            id="clasificacion"
            className={styles.select}
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value)}
          >
            <option value="" disabled>
              -- Selecciona una clasificación --
            </option>
            <option value="P">Patente</option>
            <option value="G">Genérico</option>
            <option value="C">Controlado</option>
            <option value="E">Especialidad</option>
          </select>
        </div>
        <div className={styles.modalActions}>
          <button onClick={handleSave} className={styles.saveButton}>
            Guardar
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body // Renderiza el modal fuera del contenedor actual
  );
}
