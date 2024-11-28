import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";
import EditMedicamentoForm from "./editMedicamentoForm"; // Importamos el formulario de edición

const MedicamentosTable = ({ medicamentos = [], onDelete, onEdit }) => {
  const [selectedMedicamento, setSelectedMedicamento] = useState(null); // Estado para controlar el modal
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda

  // Filtrar medicamentos según el término de búsqueda
  const filteredMedicamentos = medicamentos.filter((medicamento) =>
    [medicamento.ean, medicamento.sustancia]
      .filter(Boolean) // Maneja valores nulos o indefinidos
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCloseModal = () => setSelectedMedicamento(null); // Cierra el modal

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
    <>
      <div className={styles.tableContainer}>
        <h2 className={styles.titleTable}>Medicamentos Registrados</h2>
 {/* Campo de búsqueda */}
 <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Buscar por EAN o Sustancia..."
              className={`${styles.searchBar}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el estado del término de búsqueda
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
              <th>EAN</th>
              <th>Sustancia</th>
              <th>Piezas</th>
              <th>Estado de Stock</th>
              <th>Fecha de Creación</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            
          {filteredMedicamentos.length > 0 ? (
              filteredMedicamentos.map((medicamento) => {
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
                        ? new Date(
                            medicamento.fechaCreacion
                          ).toLocaleDateString("es-ES")
                        : "N/A"}
                    </td>
                    <td>{medicamento.activo ? "Sí" : "No"}</td>
                    <td>
                      <div className={styles.buttonRow}>
                        <button
                          onClick={() => onEdit?.(medicamento)} // Abre el modal desde el componente principal
                          className={styles.surtirButton}
                        >
                          <span className={styles.icon}>
                            {/* Ícono de surtir */}
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
                          onClick={() => onDelete?.(medicamento.id)} // Manejo de onDelete como opcional
                          className={styles.deleteButton}
                        >
                          <span className={styles.icon}>
                            {/* Ícono de eliminar */}
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

      {/* Modal para surtir */}
      {selectedMedicamento && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <EditMedicamentoForm
              medicamento={selectedMedicamento}
              onEdit={(updatedMedicamento) => {
                onEdit(updatedMedicamento);
                handleCloseModal(); // Cierra el modal tras guardar cambios
              }}
              onCancel={handleCloseModal} // Cierra el modal sin guardar cambios
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MedicamentosTable;
