import React from "react";
import { FaUser, FaCalendarAlt, FaBuilding, FaUsers } from "react-icons/fa"; // Importamos los iconos
import styles from "../../css/SURTIMIENTOS_ESTILOS/datosEmpleado.module.css";

const InformacionPaciente = ({ paciente }) => {
  if (!paciente) return null;

  return (
    <div className={styles.empleadoCard}>
      <h2 className={styles.empleadoTitle}>Información del Paciente</h2>
      
      <p className={styles.dato}>
        <FaUser className={styles.icon} />
        <strong>Nombre del Paciente:</strong> {paciente.nombrepaciente}
      </p>
      <p className={styles.dato}>
        <FaCalendarAlt className={styles.icon} />
        <strong>Edad:</strong> {paciente.edad}
      </p>
      <p className={styles.dato}>
        <FaBuilding className={styles.icon} />
        <strong>Departamento:</strong> {paciente.departamento}
      </p>
      <p className={styles.dato}>
        <FaUsers className={styles.icon} />
        <strong>Parentesco:</strong> {paciente.parentesco}
      </p>
    </div>
  );
};

export default InformacionPaciente;
