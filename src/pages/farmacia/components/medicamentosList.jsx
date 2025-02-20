// pages/farmacia/components/MedicamentosList.jsx
import React from "react";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

const MedicamentosList = ({
  detalle,
  toggleInput,
  handleEANChange,
  handleAceptarEAN,
}) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.subtitle}>Detalle de Medicamentos</h2>
      {detalle && detalle.length > 0 ? (
        <div className={styles.medicamentosContainer}>
          {detalle.map((item) => {
            const pendiente = item.piezas - item.delivered;
            return (
              <div className={styles.medicamentoCard} key={item.idSurtimiento}>
                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-pills ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Medicamento:</span>
                  <span className={styles.medicamentoValue}>
                    {item.nombreMedicamento || item.claveMedicamento}
                  </span>
                </div>

                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-prescription ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Indicaciones:</span>
                  <span className={styles.medicamentoValue}>{item.indicaciones}</span>
                </div>

                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-boxes-stacked ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Cantidad:</span>
                  <span className={styles.medicamentoValue}>{item.cantidad}</span>
                </div>

                {/* Piezas por entregar */}
                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-cubes ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Piezas por entregar:</span>
                  <span className={styles.medicamentoValue}>{item.piezas}</span>
                </div>

                {/* Entregado */}
                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-check ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Entregado:</span>
                  <span className={styles.medicamentoValue}>{item.delivered}</span>
                </div>

                {/* Pendiente */}
                <div className={styles.medicamentoRow}>
                  <i className={`fa-solid fa-clock ${styles.medicamentoIcon}`}></i>
                  <span className={styles.medicamentoLabel}>Pendiente:</span>
                  <span className={styles.medicamentoValue}>{pendiente}</span>
                </div>

                {/* Botón para activar el input EAN */}
                <div className={styles.medicamentoRow}>
                  <button
                    onClick={() => toggleInput(item.idSurtimiento)}
                    className={styles.toggleInputButton}
                    disabled={pendiente <= 0}
                  >
                    {item.showInput ? "Ocultar" : "Escanear EAN"}
                  </button>
                </div>

                {/* Input EAN, visible si showInput es true */}
                {item.showInput && (
                  <div className={styles.medicamentoRow}>
                    <input
                      type="text"
                      placeholder="Escanea el EAN"
                      value={item.eanValue}
                      onChange={(e) => handleEANChange(item.idSurtimiento, e.target.value)}
                      className={styles.eanInput}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAceptarEAN(item.idSurtimiento);
                      }}
                      className={styles.eanButton}
                    >
                      Aceptar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p>No se encontró detalle de medicamentos.</p>
      )}
    </div>
  );
};

export default MedicamentosList;
