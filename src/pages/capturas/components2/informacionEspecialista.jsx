import React, { useState, useEffect } from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/informacionEspecialista.module.css";

const InformacionEspecialista = ({ especialista, onDiagnosticoChange }) => {
  const [diagnosticoEditable, setDiagnosticoEditable] = useState(
    especialista?.diagnostico || ""
  );

  useEffect(() => {
    // Llamar a la función onDiagnosticoChange cuando el diagnóstico cambie
    if (onDiagnosticoChange) {
      onDiagnosticoChange(diagnosticoEditable);
    }
  }, [diagnosticoEditable, onDiagnosticoChange]);

  if (!especialista) return null;

  return (
    <div className={styles.especialistaCard}>
      <h2 className={styles.especialistaTitle}>Información del Especialista</h2>
      <p>
        <strong>Nombre del Médico:</strong>{" "}
        {especialista.nombreProveedor || "No disponible"}
      </p>
      <p>
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
          onChange={(e) => setDiagnosticoEditable(e.target.value)}
          placeholder="Escribe el diagnóstico..."
        />
      </div>
    </div>
  );
};

export default InformacionEspecialista;