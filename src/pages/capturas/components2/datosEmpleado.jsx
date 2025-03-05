import React from "react";
import { FaUser, FaIdCard } from "react-icons/fa"; // Importamos los iconos
import styles from "../../css/SURTIMIENTOS_ESTILOS/datosEmpleado.module.css";

const DatosEmpleado = ({ empleado }) => {
  if (!empleado) return null;

  return (
    <div className={styles.empleadoCard}>
      <h2 className={styles.empleadoTitle}>Datos del Empleado: </h2>

      <p className={styles.dato}>
        <FaUser className={styles.icon} />
        <strong>Nombre Completo: </strong> {empleado.nombreCompleto}
      </p>
      <p className={styles.dato}>
        <FaIdCard className={styles.icon} />
        <strong>Número de Nómina: </strong> {empleado.clavenomina}
      </p>
    </div>
  );
};

export default DatosEmpleado;
