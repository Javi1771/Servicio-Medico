import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";

const FormMedicamento = ({ onAddMedicamento, message }) => {
  const [formData, setFormData] = useState({
    medicamento: "",
    clasificación: "",
    presentación: "",
    ean: "",
    piezas: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMedicamento({
      medicamento: formData.medicamento,
      clasificación: formData.clasificación,
      presentación: parseInt(formData.presentación, 10),
      ean: parseInt(formData.ean, 10),
      piezas: parseInt(formData.piezas, 10),
    });
    setFormData({
      medicamento: "",
      clasificación: "",
      presentación: "",
      ean: "",
      piezas: "",
    });
  };

  return (
    <div>
      <h2 className={styles.title}>Registro de Medicamentos</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.formGroup}>
          <label htmlFor="medicamento" className={styles.label}>
            Medicamento:
          </label>
          <input
            type="text"
            id="medicamento"
            name="medicamento"
            value={formData.medicamento}
            onChange={handleChange}
            placeholder="añade el nombre del medicamento"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="clasificación" className={styles.label}>
            Clasificación:
          </label>
          <select
            id="clasificación"
            name="clasificación"
            value={formData.clasificación}
            onChange={handleChange}
            required
            className={styles.input}
          >
            <option value="">Seleccione una opción</option>
            <option value="p">PATENTE</option>
            <option value="g">GENERICO</option>
            <option value="c">CONTROLADO</option>
            <option value="e">ESPECIALIDAD</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="presentación" className={styles.label}>
            Presentación:
          </label>
          <input
            type="number"
            id="presentación"
            name="presentación"
            value={formData.presentación}
            onChange={handleChange}
            placeholder="mg, ml, ui, g ..."
            required
            className={styles.input}
          />
        </div>
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
            placeholder="coloca el código de barras"
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
            placeholder="ingres el numero de piezas a registrar"
            required
            className={styles.input}
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
