
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import styles from "../../css/estilosSurtimientos/tableSurtimientos.module.css";

const MedicamentosForm = () => {
  const [medicamentos, setMedicamentos] = useState([]); // Lista de medicamentos
  const [selectedMedicamento, setSelectedMedicamento] = useState(""); // Medicamento seleccionado

  // Fetch para obtener la lista de medicamentos
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/surtimientos/getMedicamentos"); // Endpoint para obtener medicamentos
      const data = await response.json();
      setMedicamentos(
        data.map((item) => ({
          id: item.CLAVEMEDICAMENTO,
          name: item.MEDICAMENTO,
        }))
      );
    } catch (error) {
      console.error("Error fetching medicamentos:", error);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  // Manejador de cambios en el select
  const handleChange = (event) => {
    setSelectedMedicamento(event.target.value);
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Seleccionar Medicamento</h2>
      <form className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="medicamentoSelect" className={styles.label}>
            Medicamentos:
          </label>
          <div className={styles.inputWithButton}>
            <select
              id="medicamentoSelect"
              value={selectedMedicamento}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="" disabled>
                -- Selecciona un medicamento --
              </option>
              {medicamentos.map((medicamento) => (
                <option key={medicamento.id} value={medicamento.name}>
                  {medicamento.name}
                </option>
              ))}
            </select>
            <button type="button" className={styles.addButton}>
              +
            </button>
          </div>
        </div>

        {/* Campo de Indicaciones */}
        <div className={styles.formGroup}>
          <label htmlFor="indicaciones" className={styles.label}>
            Indicaciones:
          </label>
          <textarea
            id="indicaciones"
            className={styles.textarea}
            placeholder="Escribe las indicaciones..."
          ></textarea>
        </div>

        {/* Campo de Tratamiento */}
        <div className={styles.formGroup}>
          <label htmlFor="tratamiento" className={styles.label}>
            Tratamiento (periodo,dias):
          </label>
          <textarea
            id="tratamiento"
            className={styles.textarea}
            placeholder="Escribe el tratamiento..."
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default MedicamentosForm;