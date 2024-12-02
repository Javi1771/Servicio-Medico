import React from "react";
import { motion } from "framer-motion";
import styles from "../../css/EstilosFarmacia/SurtirMedicamentoModal.module.css";

const SurtirMedicamentoModal = ({ isOpen, onClose, medicamentos }) => {
  if (!isOpen) return null;

  // Variants para las animaciones de entrada/salida
  const slideVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <motion.div
      className={styles.modalBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideVariants}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        className={styles.modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        transition={{ duration: 0.3 }}
      >
        <button className={styles.modalCloseButton} onClick={onClose}>
          ✕
        </button>
        <h3 className={styles.modalTitle}>Registrar Medicamento</h3>
        <form className={styles.surtirForm}>
          <div className={styles.formGroup}>
            <label htmlFor="medicamento">Medicamento</label>
            <select id="medicamento" className={styles.selectInput}>
              <option value="">Seleccionar Medicamento</option>
              {Array.isArray(medicamentos) &&
                medicamentos.map((medicamento) => (
                  <option key={medicamento.id} value={medicamento.id}>
                    {medicamento.sustancia}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cantidad">Cantidad</label>
            <input
              type="number"
              id="cantidad"
              placeholder="Cantidad a surtir"
              className={styles.textInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              placeholder="Añadir observaciones..."
              className={styles.textInput}
            ></textarea>
          </div>
          <button type="submit" className={styles.submitButton}>
            Registrar
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SurtirMedicamentoModal;
