import React, { useState } from "react";
import useHistorialSurtimientos from "../../../hooks/surtimientosHook/useHistorialSurtimientos";
import useDetalleSurtimientos from "../../../hooks/surtimientosHook/useDetalleSurtimientos";
import DetalleSurtimientosModal from "./detallesSurtimientos";
import styles from "../../css/estilosSurtimientos/historialSurtimientos.module.css";

const HistorialSurtimientos = ({ folioPase }) => {
  const { historial, loading, error } = useHistorialSurtimientos(folioPase);
  const [selectedFolio, setSelectedFolio] = useState(null);
  const { detalles } = useDetalleSurtimientos(selectedFolio); // Eliminamos las constantes no utilizadas
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (folioSurtimiento) => {
    setSelectedFolio(folioSurtimiento);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFolio(null);
  };

  if (loading) {
    return <p className={styles.warning}>Cargando historial de surtimientos...</p>;
  }

  if (error) {
    return <p className={styles.error}>Error al cargar el historial: {error}</p>;
  }

  if (historial.length === 0) {
    return <p className={styles.warning}>No hay surtimientos registrados.</p>;
  }

  return (
    <>
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
              <tr
                key={surtimiento.FOLIO_SURTIMIENTO}
                onClick={() => handleRowClick(surtimiento.FOLIO_SURTIMIENTO)}
              >
                <td>{surtimiento.FOLIO_SURTIMIENTO}</td>
                <td>{new Date(surtimiento.FECHA_EMISION).toLocaleString()}</td>
                <td>{surtimiento.NOMBRE_PACIENTE}</td>
                <td>{surtimiento.DIAGNOSTICO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DetalleSurtimientosModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        detalles={detalles}
      />
    </>
  );
};

export default HistorialSurtimientos;
