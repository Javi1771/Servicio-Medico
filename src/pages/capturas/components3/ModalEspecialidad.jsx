// src/pages/capturas/components3/ModalEspecialidad.jsx
import React, { useEffect } from 'react';
import styles from '../../css/surtimientos3/ModalEspecialidad.module.css';

export function ModalEspecialidad({ open, onClose, onConfirm }) {
  // El hook siempre se declara en el mismo orden
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
      onConfirm();
    }, 1500);
    return () => clearTimeout(timer);
  }, [open, onClose, onConfirm]);

  // Luego el early return
  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <p>Consulta de especialidad detectada</p>
      </div>
    </div>
  );
}
