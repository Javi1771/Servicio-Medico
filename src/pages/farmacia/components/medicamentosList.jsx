import React, { useState, useRef } from "react";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

const MedicamentosList = ({ detalle, toggleInput, handleEANChange, handleAceptarEAN }) => {
  const [scanTimeouts, setScanTimeouts] = useState({});
  const inputRefs = useRef({}); //* 🔹 Guarda referencias a los inputs para hacer focus automático

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
                    onClick={() => {
                      toggleInput(item.idSurtimiento);
                      setTimeout(() => {
                        if (inputRefs.current[item.idSurtimiento]) {
                          inputRefs.current[item.idSurtimiento].focus();
                        }
                      }, 100);
                    }}
                    className={styles.toggleInputButton}
                    disabled={pendiente <= 0}
                  >
                    {item.showInput ? "Ocultar" : "Escanear EAN"}
                  </button>
                </div>

                {/* Input EAN, ahora validado automáticamente sin cerrarse */}
                {item.showInput && (
                  <div className={styles.medicamentoRow}>
                    <input
                      ref={(el) => (inputRefs.current[item.idSurtimiento] = el)}
                      type="text"
                      placeholder="Escanea el EAN"
                      value={item.eanValue || ""}
                      onChange={(e) => {
                        const ean = e.target.value.trim();
                        handleEANChange(item.idSurtimiento, ean);

                        //* Si ya hay un timeout previo, lo cancela
                        if (scanTimeouts[item.idSurtimiento]) {
                          clearTimeout(scanTimeouts[item.idSurtimiento]);
                        }

                        //* Espera 500ms después del último dígito para validar
                        const newTimeout = setTimeout(() => {
                          if (/^\d{8,13}$/.test(ean)) {
                            console.log("✅ Escaneo finalizado, validando EAN:", ean);
                            handleAceptarEAN(item.idSurtimiento, ean); //*🔹 Ahora enviamos el EAN correcto
                            handleEANChange(item.idSurtimiento, ""); //*🔹 Limpia solo el input, no cierra el input

                            //*🔹 Mantiene el input enfocado para escaneos continuos
                            setTimeout(() => {
                              if (inputRefs.current[item.idSurtimiento]) {
                                inputRefs.current[item.idSurtimiento].focus();
                              }
                            }, 100);
                          }
                        }, 500);

                        setScanTimeouts((prev) => ({
                          ...prev,
                          [item.idSurtimiento]: newTimeout,
                        }));
                      }}
                      className={styles.eanInput}
                      autoFocus
                    />
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
