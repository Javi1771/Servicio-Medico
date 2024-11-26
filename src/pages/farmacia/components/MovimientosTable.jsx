import React from "react";
import styles from "../../css/EstilosFarmacia/MovimientosTable.module.css";

const MovimientosTable = ({ movimientos = [] }) => {
  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.titleTable}>Movimientos de Medicamentos</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>EAN</th>
            <th>Sustancia</th>
            <th>Paciente</th>
            <th>Piezas Otorgadas</th>
            <th>Indicaciones</th>
            <th>Tratamiento</th>
            <th>Clave Consulta</th>
            <th>Fecha Otorgación</th>
          </tr>
        </thead>
        <tbody>
          {movimientos?.length > 0 ? (
            movimientos.map((movimiento) => (
              <tr key={movimiento.id_med_pac}>
                <td>{movimiento.id_med_pac}</td>
                <td>{movimiento.ean}</td>
                <td>{movimiento.sustancia}</td>
                <td>{movimiento.nombre_paciente || "N/A"}</td>
                <td>{movimiento.piezas_otorgadas}</td>
                <td>{movimiento.indicaciones || "N/A"}</td>
                <td>{movimiento.tratamiento || "N/A"}</td>
                <td>{movimiento.claveconsulta || "N/A"}</td>
                <td>
                  {movimiento.fecha_otorgacion
                    ? new Date(movimiento.fecha_otorgacion).toLocaleString(
                        "es-ES"
                      )
                    : "N/A"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className={styles.noData}>
                No hay movimientos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MovimientosTable;