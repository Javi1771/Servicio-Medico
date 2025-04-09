import { useState } from "react";
import Modal from "react-modal";
import styles from "./beneficiarioDelete.module.css"; // O tu propio CSS

export default function DeleteWithReasonModal({
  isOpen,
  onClose,
  onConfirm,   // Función para ejecutar la eliminación real
  beneficiaryId,
}) {
  const [reason, setReason] = useState("");

  // Cuando el usuario hace clic en "Eliminar"
  const handleDelete = () => {
    if (!reason.trim()) {
      // Si no hay motivo, podrías alertar
      return alert("Por favor ingresa un motivo de eliminación.");
    }

    // Llama la función que recibimos por props,
    // pasándole el id y el motivo
    onConfirm(beneficiaryId, reason);
    // Cierra el modal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Motivo de eliminación"
      className={styles.modal}
      overlayClassName={styles.modalOverlay}
    >
      <div className={styles.modalContent}>
        <h2>Motivo de eliminación</h2>
        <textarea
          className={styles.inputField}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Escribe aquí el motivo de la eliminación..."
        />
        <div className={styles.buttonGroup}>
          <button onClick={handleDelete} className={styles.deleteButton}>
            Eliminar
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
