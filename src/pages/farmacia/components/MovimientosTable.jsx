import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/MovimientosTable.module.css";


const MovimientosTable = ({ movimientos = [] }) => {
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda

  // Filtrar movimientos según el término de búsqueda
  const filteredMovimientos = movimientos.filter((movimiento) =>
    [movimiento.ean, movimiento.sustancia, movimiento.nombre_paciente, movimiento.clave_nomina]
      .filter(Boolean) // Maneja valores nulos o indefinidos
      .some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()) // Convierte el valor a string para manejar números
      )
  );

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.titleTable}>Movimientos de Medicamentos</h2>

      {/* Campo de búsqueda */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar por EAN, Sustancia o Paciente..."
            className={styles.searchBar}
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
            <th>N°Nomina</th>
            <th>Paciente</th>
            <th>Piezas Otorgadas</th>
            <th>Indicaciones</th>
            <th>Tratamiento</th>
            <th>Clave Consulta</th>
            <th>Nombre Medico</th>
            <th>Fecha Otorgación</th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {filteredMovimientos?.length > 0 ? (
            filteredMovimientos.map((movimiento) => (
              <tr key={movimiento.id_med_pac}>
                <td>{movimiento.id_med_pac}</td>
                <td>{movimiento.ean}</td>
                <td>{movimiento.sustancia}</td>
                <td>{movimiento.clave_nomina}</td>
                <td>{movimiento.nombre_paciente || "N/A"}</td>
                <td>{movimiento.piezas_otorgadas}</td>
                <td>{movimiento.indicaciones || "N/A"}</td>
                <td>{movimiento.tratamiento || "N/A"}</td>
                <td>{movimiento.claveconsulta || "N/A"}</td>
                <td>{movimiento.nombre_medico || "N/A"}</td>
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
              <td colSpan="11" className={styles.noData}>
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
