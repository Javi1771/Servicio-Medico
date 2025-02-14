import React, { useState } from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";

const CargaMedicamentosForm = ({
  medicamentos,
  onAddMedicamento,
  onSave,
  disableAdd,
  receta = [], // Establece un valor predeterminado para evitar errores
}) => {
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [piezas, setPiezas] = useState(""); // Nueva variable para las piezas

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
      claveMedicamento: selectedMedicamento || "", // Validar que tenga un valor
      indicaciones,
      cantidad,
      piezas: piezas,
    };
    console.log("Nuevo medicamento añadido:", nuevoMedicamento);
    
    // Actualizar el estado de receta directamente, para que se vea reflejado de inmediato en la tabla
    onAddMedicamento(nuevoMedicamento); // Añadir el medicamento a la receta

    // Limpiar los campos después de añadir el medicamento
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");
    setPiezas(""); // Limpiar el campo de piezas
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
          disabled={disableAdd} // Deshabilitar select si disableAdd es true
        >
          <option value="">Seleccionar Medicamento</option>
          {medicamentos &&
            medicamentos.map((med) => (
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
          disabled={disableAdd} // Deshabilitar input si disableAdd es true
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
          disabled={disableAdd} // Deshabilitar input si disableAdd es true
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
        disabled={disableAdd} // Deshabilitar botón si disableAdd es true
      >
        Añadir a la Receta
      </button>
      <button onClick={() => onSave()} className={styles.saveButton}>
        Guardar
      </button>
    </div>
  );
};

export default CargaMedicamentosForm;
