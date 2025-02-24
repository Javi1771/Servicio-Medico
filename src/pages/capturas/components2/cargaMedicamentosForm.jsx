// CargaMedicamentosForm.jsx 
import React, { useState } from "react";
import Swal from "sweetalert2";
import ModalPdf from "./modalPdf";
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";

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

  const handleAddMedicamentoLocal = () => {
    if (!selectedMedicamento) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, selecciona un medicamento.",
      });
      return;
    }
    if (!indicaciones.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona las indicaciones.",
      });
      return;
    }
    if (!cantidad.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona la cantidad.",
      });
      return;
    }
    if (!piezas.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, proporciona las piezas.",
      });
      return;
    }

    // Verificar si ya existe en la receta
    if (receta.find((med) => med.claveMedicamento === selectedMedicamento)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Este medicamento ya está en la receta.",
      });
      return;
    }

    // Obtener información del medicamento seleccionado para agregar el nombre
    const medSeleccionado = medicamentos.find(
      (med) => med.CLAVEMEDICAMENTO === selectedMedicamento
    );

    const nuevoMedicamento = {
      claveMedicamento: selectedMedicamento,
      nombreMedicamento: medSeleccionado.MEDICAMENTO,
      indicaciones,
      cantidad,
      piezas,
    };

    console.log("Nuevo medicamento añadido:", nuevoMedicamento);
    onAddMedicamento(nuevoMedicamento);

    // Limpiar campos
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");
    setPiezas("");
  };

  const handleSaveAndShowPdf = async () => {
    if (!folio || isNaN(folio)) {
      Swal.fire({
        icon: "error",
        title: "Folio inválido",
        text: "El folio ingresado es inválido.",
      });
      console.error("Folio inválido en handleSaveAndShowPdf:", folio);
      return;
    }

    await onSave(); // Guardar en la BD

    setTimeout(() => {
      console.log("Mostrando modal con folio:", folio);
      setShowModal(true);
    }, 1000);
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Carga de Medicamentos</h2>

      <div className={styles.inputGroup}>
        <label htmlFor="medicamento">Medicamento</label>
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
        <label htmlFor="indicaciones">Indicaciones</label>
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
        <label htmlFor="cantidad">Cantidad</label>
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
        <label htmlFor="piezas">Piezas</label>
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
        Añadir a la Receta
      </button>

      <button onClick={handleSaveAndShowPdf} className={styles.saveButton}>
        Guardar y Generar Receta
      </button>

      {showModal && <ModalPdf folio={folio} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CargaMedicamentosForm;
