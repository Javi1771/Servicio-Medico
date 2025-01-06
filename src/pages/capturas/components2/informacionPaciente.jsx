import React from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/datosEmpleado.module.css"; // Reutilizamos los estilos del card

const InformacionPaciente = ({ paciente }) => {
  if (!paciente) return null;

  return (
    <div className={styles.empleadoCard}>
      <h2 className={styles.empleadoTitle}>Información del Paciente</h2>
      <p>
        <strong>Nombre del Paciente:</strong> {paciente.nombrepaciente}
      </p>
      <p>
        <strong>Edad:</strong> {paciente.edad}
      </p>
      <p>
        <strong>Departamento:</strong> {paciente.departamento}
      </p>
      <p>
        <strong>Parentesco:</strong> {paciente.parentesco}
      </p>
    </div>
  );
};

export default InformacionPaciente;
