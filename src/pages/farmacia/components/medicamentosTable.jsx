import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";

const MedicamentosTable = ({ medicamentos = [], onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mapeo de clasificación: letra -> nombre completo
  const classificationMapping = {
    p: "PATENTE",
    g: "GENERICO",
    c: "CONTROLADO",
    e: "ESPECIALIDAD",
  };

  // Función para determinar el estado de las piezas
  const getStockStatus = (piezas) => {
    if (piezas <= 10) return { label: "Malo", className: styles.badStock };
    if (piezas >= 11 && piezas <= 39) return { label: "Medio", className: styles.mediumStock };
    return { label: "Bueno", className: styles.goodStock };
  };

  // Filtrar por medicamento o clasificación
  const filteredMedicamentos = medicamentos.filter((med) =>
    [med.medicamento, med.clasificación, String(med.ean), String(med.piezas)]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.titleTable}>Medicamentos Registrados</h2>

      {/* Campo de búsqueda */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar por Medicamento, Clasificación, EAN o Piezas..."
            className={styles.searchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className={styles.searchButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.searchIcon}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Medicamento</th>
            <th>Clasificación</th>
            <th>Presentación</th>
            <th>EAN</th>
            <th>Piezas</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredMedicamentos.length > 0 ? (
            filteredMedicamentos.map((med) => {
              const stockStatus = getStockStatus(med.piezas);
              return (
                <tr key={med.id}>
                  <td>{med.id}</td>
                  <td>{med.medicamento}</td>
                  <td>
                    {classificationMapping[
                      med.clasificación?.toLowerCase()
                    ] || med.clasificación}
                  </td>
                  <td>{`c/${med.presentación}`}</td> {/* Presentación con "c/" */}
                  <td>{med.ean}</td>
                  <td>{`(${med.piezas}) en stock`}</td> {/* Piezas con "(número) en stock" */}
                  <td>
                    <span className={`${styles.stockBadge} ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                  <td>
                    <div className={styles.buttonRow}>
                      <button
                        onClick={() => onEdit?.(med)}
                        className={styles.surtirButton}
                      >
                        <span className={styles.icon}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.iconSvg}
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 1 0 7.78L12 21.23l-8.84-8.84a5.5 5.5 0 0 1 7.78-7.78L12 5.77l1.06-1.06a5.5 5.5 0 0 1 7.78 0z"></path>
                            <line x1="12" y1="8" x2="12" y2="14"></line>
                            <line x1="9" y1="11" x2="15" y2="11"></line>
                          </svg>
                        </span>
                      </button>
                      <button
                        onClick={() => onDelete?.(med.id)}
                        className={styles.deleteButton}
                      >
                        <span className={styles.icon}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.iconSvg}
                          >
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                          </svg>
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className={styles.noData}>
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
