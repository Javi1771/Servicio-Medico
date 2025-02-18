import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import styles from "../../css/EstilosFarmacia/EditMedicamentoForm.module.css";

const EditMedicamentoForm = ({ medicamento, onEdit, onCancel }) => {
  const [formData, setFormData] = useState({
    medicamento: "",
    clasificación: "",
    presentación: "",
    ean: "",
    piezas: "",
  });

  useEffect(() => {
    if (medicamento) {
      setFormData({
        medicamento: medicamento.medicamento || "",
        clasificación: medicamento.clasificación
          ? medicamento.clasificación.toLowerCase()
          : "", // Convertir a minúsculas para coincidir con el <select>
        presentación: medicamento.presentación || "",
        ean: medicamento.ean || "",
        piezas: medicamento.piezas || "",
      });
    }
  }, [medicamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    Swal.fire({
      title: "<span style='color: #ffffff; font-weight: bold;'>¿Estás seguro?</span>",
      html: "<p style='color: #ffffff; font-size: 1.1rem;'>Los cambios serán permanentes.</p>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff9800",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, guardar cambios",
      cancelButtonText: "Cancelar",
      background: "#222234f7",
      customClass: { popup: "custom-popup" },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.style.boxShadow =
          "0px 0px 20px 4px rgba(255, 152, 0, 0.9), 0px 0px 30px 10px rgba(255, 152, 0, 0.6)";
        popup.style.borderRadius = "15px";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onEdit({
          ...formData,
          presentación: parseInt(formData.presentación, 10),
          ean: parseInt(formData.ean, 10),
          piezas: parseInt(formData.piezas, 10),
        });
      }
    });
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2 className={styles.formTitle}>Editar Medicamento</h2>
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <label>
            Medicamento:
            <input
              type="text"
              name="medicamento"
              value={formData.medicamento}
              readOnly // 🔹 No editable
              className={styles.disabledInput} // 🔹 Agregar un estilo si es necesario
            />
          </label>
          <label>
            Clasificación:
            <select
              name="clasificación"
              value={formData.clasificación}
              disabled // 🔹 No editable
              className={styles.disabledSelect} // 🔹 Agregar un estilo si es necesario
            >
              <option value="p">PATENTE</option>
              <option value="g">GENERICO</option>
              <option value="c">CONTROLADO</option>
              <option value="e">ESPECIALIDAD</option>
            </select>
          </label>
          <label>
            Presentación:
            <input
              type="number"
              name="presentación"
              value={formData.presentación || ""}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            EAN:
            <input
              type="number"
              name="ean"
              value={formData.ean || ""}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Piezas:
            <input
              type="number"
              name="piezas"
              value={formData.piezas || ""}
              onChange={handleChange}
              required
            />
          </label>
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.saveButton}>
              Guardar Cambios
            </button>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicamentoForm;
