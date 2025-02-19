import React, { useState } from "react";
import ModalPdf from "./modalPdf"; // Importamos el modal que mostrará el PDF
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";

const CargaMedicamentosForm = ({
  medicamentos,
  onAddMedicamento,
  onSave,
  disableAdd,
  folio, // 🔹 Recibir folio como prop desde SurtimientosBanner.jsx
}) => {
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [piezas, setPiezas] = useState(""); 
  const [showModal, setShowModal] = useState(false); // Controla la visibilidad del modal

  const handleAddMedicamentoLocal = () => {
    if (!selectedMedicamento) {
      alert("Por favor, selecciona un medicamento.");
      return;
    }
    if (!indicaciones.trim()) {
      alert("Por favor, proporciona las indicaciones.");
      return;
    }
    if (!cantidad.trim()) {
      alert("Por favor, proporciona la cantidad.");
      return;
    }
    if (!piezas.trim()) {
      alert("Por favor, proporciona las piezas.");
      return;
    }

    const nuevoMedicamento = {
      claveMedicamento: selectedMedicamento || "", 
      indicaciones,
      cantidad,
      piezas,
    };
    console.log("Nuevo medicamento añadido:", nuevoMedicamento);
    onAddMedicamento(nuevoMedicamento);
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");
    setPiezas(""); 
  };

  // 🔹 Modificación: Guardar receta y mostrar PDF
  const handleSaveAndShowPdf = async () => {
    if (!folio || isNaN(folio)) {
      alert("Folio inválido.");
      console.error("⚠️ Folio inválido en handleSaveAndShowPdf:", folio);
      return;
    }

    await onSave(); // Guardar en la BD

    setTimeout(() => {
      console.log("📌 Mostrando modal con folio:", folio);
      setShowModal(true); // Mostrar modal con el folio correcto
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
              {med.MEDICAMENTO}
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

      {/* 🔹 Modal que muestra el PDF */}
      {showModal && <ModalPdf folio={folio} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CargaMedicamentosForm;
