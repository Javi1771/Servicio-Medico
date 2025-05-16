// src/pages/capturas/components3/ModalFormulario.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../css/surtimientos3/ModalEspecialidad.module.css';
import Medicamentos from './FormularioMedicamentos';
import { FiX } from 'react-icons/fi';

export function ModalFormulario({ open, onClose, folio, consulta, onSave }) {
  const [diag, setDiag] = useState('');
  const [meds, setMeds] = useState([]);

  // Computar validación
  const isValid = useMemo(() => {
    if (!diag.trim() || meds.length === 0) return false;
    return meds.every(m =>
      m.medicamento &&
      m.indicaciones.trim() !== '' &&
      m.tratamiento.trim() !== '' &&
      m.piezas &&
      (m.resurtir === 'no' || (m.resurtir === 'si' && m.mesesResurtir))
    );
  }, [diag, meds]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!open) {
      setDiag('');
      setMeds([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modalLarge}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={20} />
        </button>
        <h3>Añadir Diagnóstico</h3>
        <textarea
          className={styles.textarea}
          value={diag}
          onChange={e => setDiag(e.target.value)}
          placeholder="Escribe aquí el diagnóstico..."
        />

        <h4 className="text-xl font-semibold text-white mt-4 mb-2">
          Prescripción de Medicamentos
        </h4>
        <Medicamentos
          clavenomina={consulta.clavenomina}
          clavepaciente={consulta.clavepaciente}
          claveConsulta={folio}
          onChangeMedicamentos={setMeds}
        />

        {/* Mensaje de errores si no es válido */}
        {!isValid && (
          <p className="text-red-400 mt-2">
            Por favor completa diagnóstico y todos los campos de cada medicamento.
          </p>
        )}

        <button
          className={`${styles.saveBtn} ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isValid}
          onClick={() => {
            if (isValid) onSave({ diagnostico: diag.trim(), medicamentos: meds });
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
