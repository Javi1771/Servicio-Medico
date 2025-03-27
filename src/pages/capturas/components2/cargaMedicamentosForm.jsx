import React, { useState } from "react";
import Swal from "sweetalert2";
import ModalPdf from "./modalPdf";
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";
import { FaPills, FaRegEdit, FaHashtag, FaBoxes, FaPlus, FaSave } from "react-icons/fa"; // Asegúrate de importar los íconos correctos

const CargaMedicamentosForm = ({
  medicamentos,
  onAddMedicamento,
  onSave,
  disableAdd,
  folio,
  receta,
}) => {
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [piezas, setPiezas] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Rutas de sonidos
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  // Reproduce sonido de éxito o error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  const handleAddMedicamentoLocal = () => {
    if (!selectedMedicamento) {
      playSound(false);
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, selecciona un medicamento.",
      });
      return;
    }
    if (!indicaciones.trim()) {
      playSound(false);
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona las indicaciones.",
      });
      return;
    }
    if (!cantidad.trim()) {
      playSound(false);
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona la cantidad.",
      });
      return;
    }
    if (!piezas.trim()) {
      playSound(false);
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona las piezas.",
      });
      return;
    }

    // Verificar si ya existe en la receta
    if (receta.find((med) => med.claveMedicamento === selectedMedicamento)) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Este medicamento ya está en la receta.",
      });
      return;
    }

    // Obtener la información del medicamento seleccionado para agregar el nombre
    const medSeleccionado = medicamentos.find(
      (med) => med.CLAVEMEDICAMENTO === selectedMedicamento
    );
    const nuevoMedicamento = {
      claveMedicamento: selectedMedicamento,
      nombreMedicamento: medSeleccionado.MEDICAMENTO,
      indicaciones,
      cantidad,
      piezas,
      clasificacion: medSeleccionado.CLASIFICACION, // <-- AÑADE ESTO
    };

    onAddMedicamento(nuevoMedicamento);

    // Limpiar campos
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");
    setPiezas("");
  };

  const handleSaveAndShowPdf = async () => {
    if (!folio || isNaN(folio)) {
      playSound(false);
      Swal.fire({
        icon: "error",
        title: "Folio inválido",
        text: "El folio ingresado es inválido.",
      });
      return;
    }

    await onSave();
    setTimeout(() => {
      setShowModal(true);
    }, 1000);
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Carga de Medicamentos</h2>

      <div className={styles.inputGroup}>
        <label htmlFor="medicamento" className={styles.labelWithIcon}>
          <FaPills className={styles.icon} /> Medicamento
        </label>
        <select
          id="medicamento"
          value={selectedMedicamento}
          onChange={(e) => setSelectedMedicamento(e.target.value)}
          className={styles.select}
          disabled={disableAdd}
        >
          <option value="">Seleccionar Medicamento</option>
          {medicamentos.map((med) => (
            <option key={med.CLAVEMEDICAMENTO} value={med.CLAVEMEDICAMENTO}>
              {`${med.MEDICAMENTO} - Presentación: c/${med.PRESENTACION} - Piezas: ${med.PIEZAS}`}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="indicaciones" className={styles.labelWithIcon}>
          <FaRegEdit className={styles.icon} /> Indicaciones
        </label>
        <input
          type="text"
          id="indicaciones"
          value={indicaciones}
          onChange={(e) => setIndicaciones(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="cantidad" className={styles.labelWithIcon}>
          <FaHashtag className={styles.icon} /> Cantidad
        </label>
        <input
          type="text"
          id="cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="piezas" className={styles.labelWithIcon}>
          <FaBoxes className={styles.icon} /> Piezas
        </label>
        <input
          type="number"
          id="piezas"
          value={piezas}
          onChange={(e) => setPiezas(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <button
        onClick={handleAddMedicamentoLocal}
        className={styles.addButton}
        disabled={disableAdd}
      >
        <FaPlus className={styles.icon} /> Añadir a la Receta
      </button>

      <button onClick={handleSaveAndShowPdf} className={styles.saveButton}>
        <FaSave className={styles.icon} /> Guardar y Generar Receta
      </button>

      {showModal && (
        <ModalPdf folio={folio} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default CargaMedicamentosForm;
