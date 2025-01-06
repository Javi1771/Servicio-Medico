import React, { useState } from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";

const CargaMedicamentosForm = ({ medicamentos, onAddMedicamento, onSave }) => {
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [receta, setReceta] = useState([]);

  const handleAddMedicamento = () => {
    if (selectedMedicamento && indicaciones && cantidad) {
      const nuevoMedicamento = {
        claveMedicamento: selectedMedicamento,
        indicaciones,
        cantidad,
      };
      setReceta((prev) => [...prev, nuevoMedicamento]);
      onAddMedicamento(nuevoMedicamento);
      setSelectedMedicamento("");
      setIndicaciones("");
      setCantidad("");
    }
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
        />
      </div>

      <button onClick={handleAddMedicamento} className={styles.addButton}>
        Añadir a la Receta
      </button>

      {/* Mostrar la tabla con los medicamentos añadidos */}
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

      <button onClick={onSave} className={styles.saveButton}>
        Guardar
      </button>
    </div>
  );
};

export default CargaMedicamentosForm;
