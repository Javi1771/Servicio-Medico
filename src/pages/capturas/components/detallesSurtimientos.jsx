import React from "react";
import ReactDOM from "react-dom";
import useMedicamento from "../../../hooks/surtimientosHook/useMedicamento";
import styles from "../../css/estilosSurtimientos/detalleSurtimientosModal.module.css";

const DetalleSurtimientosModal = ({ isOpen, onClose, detalles }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2 className={styles.title}>Detalles del Surtimiento</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Folio Surtimiento</th>
              <th>Medicamento</th>
              <th>Cantidad</th>
              <th>Indicaciones</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((detalle) => (
              <DetalleRow key={detalle.idSurtimiento} detalle={detalle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    document.body // Renderiza el modal en el `<body>`
  );
};

const DetalleRow = ({ detalle }) => {
  const { medicamento, loading, error } = useMedicamento(detalle.claveMedicamento);

  return (
    <tr>
      <td>{detalle.idSurtimiento}</td>
      <td>{detalle.folioSurtimiento}</td>
      <td>{loading ? "Cargando..." : error ? "Error" : medicamento}</td>
      <td>{detalle.cantidad}</td>
      <td>{detalle.indicaciones}</td>
    </tr>
  );
};

export default DetalleSurtimientosModal;