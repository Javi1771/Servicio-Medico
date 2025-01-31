// cargaMedicamentosForm.jsx
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

  const handleAddMedicamentoLocal = () => { // Renombrado para evitar conflicto con la prop
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

    const nuevoMedicamento = {
      claveMedicamento: selectedMedicamento || "", // Validar que tenga un valor
      indicaciones,
      cantidad,
   };
    console.log("Nuevo medicamento añadido:", nuevoMedicamento); // Verifica qué se envía
    onAddMedicamento(nuevoMedicamento);
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");
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
          {medicamentos && medicamentos.map((med) => (
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

      <button
        onClick={handleAddMedicamentoLocal}
        className={styles.addButton}
        disabled={disableAdd} // Deshabilitar botón si disableAdd es true
      >
        Añadir a la Receta
      </button>

 {/* Mostrar la tabla con los medicamentos añadidos */}
{ !disableAdd && receta.length > 0 && (
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Medicamento</th>
        <th>Indicaciones</th>
        <th>Cantidad</th>
      </tr>
    </thead>
    <tbody>
      {receta.map((med, index) => (
        <tr key={index}>
          <td>{med.claveMedicamento}</td>
          <td>{med.indicaciones}</td>
          <td>{med.cantidad}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}


      <button onClick={onSave} className={styles.saveButton}>
        Guardar
      </button>
    </div>
  );
};

export default CargaMedicamentosForm;
