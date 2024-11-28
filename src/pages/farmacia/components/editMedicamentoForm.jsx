import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import styles from "../../css/EstilosFarmacia/EditMedicamentoForm.module.css";

const EditMedicamentoForm = ({ medicamento, onEdit, onCancel }) => {
  const [formData, setFormData] = useState({
    ean: "",
    sustancia: "",
    piezas: "",
    activo: true,
    ...medicamento,
  });

  useEffect(() => {
    if (medicamento) {
      setFormData(medicamento);
    }
  }, [medicamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    Swal.fire({
      title: "<span style='color: #ffffff; font-weight: bold;'>¿Estás seguro?</span>",
      html: "<p style='color: #ffffff; font-size: 1.1rem;'>Los cambios serán permanentes.</p>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff9800", // Botón de confirmación naranja
      cancelButtonColor: "#d33", // Botón de cancelación rojo
      confirmButtonText: "Sí, guardar cambios",
      cancelButtonText: "Cancelar",
      background: "#222234f7", // Fondo gris oscuro
      customClass: {
        popup: "custom-popup", // Clase para personalización adicional
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.style.boxShadow =
          "0px 0px 20px 4px rgba(255, 152, 0, 0.9), 0px 0px 30px 10px rgba(255, 152, 0, 0.6)"; // Sombra neón naranja
        popup.style.borderRadius = "15px"; // Esquinas redondeadas opcionales
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onEdit?.(formData); // Realiza el update directamente
      }
    });
    
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2 className={styles.formTitle}>Surtir Medicamento</h2>
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <label>
            EAN:
            <input
              type="text"
              name="ean"
              value={formData.ean || ""}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Sustancia:
            <input
              type="text"
              name="sustancia"
              value={formData.sustancia || ""}
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
          <label>
            Activo:
            <select
              name="activo"
              value={formData.activo}
              onChange={handleChange}
              required
            >
              <option value={true}>Sí</option>
              <option value={false}>No</option>
            </select>
          </label>
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.saveButton}>
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onCancel} // Simplemente llama a la función para cerrar el modal
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicamentoForm;
