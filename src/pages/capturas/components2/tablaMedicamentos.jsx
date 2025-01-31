import React from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/tablaMedicamentos.module.css";

const TablaMedicamentos = ({ medicamentos, loading, error }) => {
  if (loading) {
    return <p className={styles.loading}>Cargando medicamentos...</p>;
  }

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
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
          </tr>
        </thead>
        <tbody>
  {medicamentos?.map((medicamento) => (
    <tr key={medicamento.idDetalleReceta}>
      <td>{medicamento.nombreMedicamento}</td>  {/* Ya no descMedicamento */}
      <td>{medicamento.indicaciones}</td>
      <td>{medicamento.cantidad}</td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
};

export default TablaMedicamentos;
