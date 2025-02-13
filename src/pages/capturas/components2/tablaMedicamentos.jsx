import React from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/tablaMedicamentos.module.css";

const TablaMedicamentos = ({ medicamentos, loading, error }) => {
  console.log("📌 Medicamentos recibidos en TablaMedicamentos:", medicamentos);

  if (loading) {
    return <p className={styles.loading}>Cargando medicamentos...</p>;
  }

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
  }

  if (!medicamentos || medicamentos.length === 0) {
    return <p className={styles.error}>No hay medicamentos disponibles.</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <h3>Medicamentos Recetados</h3>
      <table className={styles.medicamentosTable}>
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Indicaciones</th>
            <th>Cantidad</th>
            <th>Piezas</th>

          </tr>
        </thead>
        <tbody>
          {medicamentos.map((med, index) => (
            <tr key={index}>
              <td>{med.nombreMedicamento}</td>
              <td>{med.indicaciones}</td>
              <td>{med.cantidad}</td>
              <td>{med.piezas}</td> {/* Mostrar el campo piezas */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaMedicamentos;
