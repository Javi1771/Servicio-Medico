import React from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/datosEmpleado.module.css";

const DatosEmpleado = ({ empleado }) => {
  if (!empleado) return null;

  return (
    <div className={styles.empleadoCard}>
      <h2 className={styles.empleadoTitle}>Datos del Empleado</h2>
      <p>
        <strong>Nombre Completo:</strong> {empleado.nombreCompleto}
      </p>
      <p>
        <strong>Número de Nómina:</strong> {empleado.clavenomina}
      </p>
    </div>
  );
};

export default DatosEmpleado;
