import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";

const FormMedicamento = ({ onAddMedicamento, message }) => {
  const [formData, setFormData] = useState({
    ean: "",
    sustancia: "",
    piezas: "",
    activo: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMedicamento({
      ean: parseInt(formData.ean, 10),
      sustancia: formData.sustancia,
      piezas: parseInt(formData.piezas, 10),
      activo: formData.activo,
    });
    setFormData({ ean: "", sustancia: "", piezas: "", activo: true });
  };

  return (
    <div>
      <h2 className={styles.title}>Registro de Medicamentos</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.formGroup}>
          <label htmlFor="ean" className={styles.label}>
            EAN (Código de Barras):
          </label>
          <input
            type="number"
            id="ean"
            name="ean"
            value={formData.ean}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="sustancia" className={styles.label}>
            Sustancia:
          </label>
          <input
            type="text"
            id="sustancia"
            name="sustancia"
            value={formData.sustancia}
            onChange={handleChange}
            maxLength={50}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="piezas" className={styles.label}>
            Piezas:
          </label>
          <input
            type="number"
            id="piezas"
            name="piezas"
            value={formData.piezas}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroupCheckbox}>
          <label htmlFor="activo" className={styles.label}>
            Activo:
          </label>
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className={styles.checkbox}
          />
        </div>
        <button type="submit" className={styles.button}>
          Registrar
        </button>
      </form>
    </div>
  );
};
export default FormMedicamento;
