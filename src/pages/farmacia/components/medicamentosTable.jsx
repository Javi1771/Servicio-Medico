import React from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css"; // Asegúrate de la ruta correcta

const MedicamentosTable = ({ medicamentos }) => {
  return (
    <div>
      <h2 className={styles.titleTable}>Medicamentos Registrados</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>EAN</th>
            <th>Sustancia</th>
            <th>Piezas</th>
            <th>Fecha de Creación</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {medicamentos.length > 0 ? (
            medicamentos.map((medicamento) => (
              <tr key={medicamento.id}>
                <td>{medicamento.id}</td>
                <td>{medicamento.ean}</td>
                <td>{medicamento.sustancia}</td>
                <td>{medicamento.piezas}</td>
                <td>
                  {medicamento.fechaCreacion
                    ? new Date(medicamento.fechaCreacion).toLocaleDateString(
                        "es-ES"
                      )
                    : "N/A"}
                </td>
                <td>{medicamento.activo ? "Sí" : "No"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className={styles.noData}>
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
