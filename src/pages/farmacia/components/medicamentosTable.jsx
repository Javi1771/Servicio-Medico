import React from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";

const MedicamentosTable = ({ medicamentos }) => {
  const getStockStatus = (piezas) => {
    if (piezas < 5) {
      return { status: "Bajo", color: styles.lowStock };
    } else if (piezas >= 5 && piezas < 20) {
      return { status: "Medio", color: styles.mediumStock };
    } else {
      return { status: "Bueno", color: styles.goodStock };
    }
  };

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.titleTable}>Medicamentos Registrados</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>EAN</th>
            <th>Sustancia</th>
            <th>Piezas</th>
            <th>Estado de Stock</th>
            <th>Fecha de Creación</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {medicamentos.length > 0 ? (
            medicamentos.map((medicamento) => {
              const { status, color } = getStockStatus(medicamento.piezas);
              return (
                <tr key={medicamento.id}>
                  <td>{medicamento.id}</td>
                  <td>{medicamento.ean}</td>
                  <td>{medicamento.sustancia}</td>
                  <td>{medicamento.piezas}</td>
                  <td>
                    <span className={`${styles.stockStatus} ${color}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    {medicamento.fechaCreacion
                      ? new Date(medicamento.fechaCreacion).toLocaleDateString(
                          "es-ES"
                        )
                      : "N/A"}
                  </td>
                  <td>{medicamento.activo ? "Sí" : "No"}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className={styles.noData}>
                No hay medicamentos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MedicamentosTable;
