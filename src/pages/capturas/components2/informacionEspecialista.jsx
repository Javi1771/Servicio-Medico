import React, { useState, useEffect } from "react";
import { FaUserMd, FaStethoscope } from "react-icons/fa"; // Importamos los iconos de react-icons
import styles from "../../css/SURTIMIENTOS_ESTILOS/informacionEspecialista.module.css";

const InformacionEspecialista = ({ especialista, onDiagnosticoChange }) => {
  const [diagnosticoEditable, setDiagnosticoEditable] = useState(
    especialista?.diagnostico || ""
  );

  useEffect(() => {
    setDiagnosticoEditable(especialista?.diagnostico || "");
  }, [especialista]);

  useEffect(() => {
    if (onDiagnosticoChange) {
      onDiagnosticoChange(diagnosticoEditable);
    }
  }, [diagnosticoEditable, onDiagnosticoChange]);

  // Permitir edición solo si no existe ya un diagnóstico
  const isEditable = !especialista?.diagnostico;

  const handleChange = (e) => {
    if (isEditable) {
      setDiagnosticoEditable(e.target.value);
    }
  };

  if (!especialista) return null;

  return (
    <div className={styles.especialistaCard}>
      <h2 className={styles.especialistaTitle}>
       Información del Especialista
      </h2>
      <p className={styles.infoText}>
        <FaUserMd className={styles.icon} />
        <strong>Nombre del Médico:</strong>{" "}
        {especialista.nombreProveedor || "No disponible"}
      </p>
      <p className={styles.infoText}>
        <FaStethoscope className={styles.icon} />
        <strong>Especialidad:</strong>{" "}
        {especialista.especialidadNombre || "No registrada"}
      </p>
      <div className={styles.diagnosticoField}>
        <label htmlFor="diagnostico">
          <strong>Diagnóstico:</strong>
        </label>
        <textarea
          id="diagnostico"
          className={styles.diagnosticoTextarea}
          value={diagnosticoEditable}
          onChange={handleChange}
          placeholder="Escribe el diagnóstico..."
          disabled={!isEditable}
        />
      </div>
    </div>
  );
};

export default InformacionEspecialista;
