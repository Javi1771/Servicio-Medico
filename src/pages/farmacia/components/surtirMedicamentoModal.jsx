import React from "react";
import { motion } from "framer-motion";
import styles from "../../css/EstilosFarmacia/SurtirMedicamentoModal.module.css";

const SurtirMedicamentoModal = ({ beneficiario, onClose }) => {
  return (
    <div className={styles.modalBackdrop}>
      <motion.div
        className={styles.modalContent}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <button
          className={styles.modalCloseButton}
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className={styles.modalTitle}>
          Surtir Medicamento para{" "}
          {`${beneficiario.NOMBRE} ${beneficiario.A_PATERNO} ${beneficiario.A_MATERNO}`}
        </h3>
        <form className={styles.surtirForm}>
          <div className={styles.formGroup}>
            <label htmlFor="medicamento">Medicamento</label>
            <input type="text" id="medicamento" placeholder="Nombre del medicamento" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cantidad">Cantidad</label>
            <input type="number" id="cantidad" placeholder="Cantidad a surtir" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="observaciones">Observaciones</label>
            <textarea id="observaciones" placeholder="Añadir observaciones..."></textarea>
          </div>
          <button type="submit" className={styles.submitButton}>
            Registrar
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SurtirMedicamentoModal;
