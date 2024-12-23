import React from "react";
import useHistorialSurtimientos from "../../../hooks/surtimientosHook/useHistorialSurtimientos";
import styles from "../../css/estilosSurtimientos/historialSurtimientos.module.css";

const HistorialSurtimientos = React.memo(({ folioPase }) => {
  console.log("Prop folioPase recibida en HistorialSurtimientos:", folioPase);

  // Hook para cargar el historial
  const { historial, loading, error } = useHistorialSurtimientos(folioPase);

  // Manejo de estados
  if (loading) {
    return (
      <p className={styles.warning}>Cargando historial de surtimientos...</p>
    );
  }

  if (error) {
    return <p className={styles.error}>Error al cargar el historial: {error}</p>;
  }

  if (historial.length === 0) {
    return (
      <p className={styles.warning}>
        No se encontraron registros para el folio {folioPase}.
      </p>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.title}>Historial de Surtimientos</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Folio Surtimiento</th>
            <th>Fecha Emisión</th>
            <th>Nombre del Paciente</th>
            <th>Diagnóstico</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((surtimiento) => (
            <tr key={surtimiento.FOLIO_SURTIMIENTO}>
              <td>{surtimiento.FOLIO_SURTIMIENTO}</td>
              <td>{new Date(surtimiento.FECHA_EMISION).toLocaleString()}</td>
              <td>{surtimiento.NOMBRE_PACIENTE}</td>
              <td>{surtimiento.DIAGNOSTICO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default HistorialSurtimientos;
