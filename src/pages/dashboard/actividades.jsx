// src/components/DashboardActividad.jsx
import React, { useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useActividades } from "../../hooks/hookActividades/useActividades";
import { getBadgeClasses } from "../../helpers/getBadgeClasses";
import { getActionIcon } from "../../helpers/getActionIcon";
import DetalleConsulta from "./components/DetalleConsulta"; // Asegúrate de la ruta correcta
import styles from "../../pages/css/estilosActividad/DashboardActividad.module.css";

// Diccionario para colores de usuario (caché en memoria)
const userColors = {};

function getRandomColorForUser(username) {
  const key = (username || "desconocido").toLowerCase().trim();
  if (userColors[key]) return userColors[key];
  const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
  userColors[key] = randomColor;
  return randomColor;
}

export default function DashboardActividad() {
  const actividades = useActividades();

  // Audio para el efecto de hover
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio("/assets/tap.mp3");
  }
  const playTapSound = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => {
      console.warn("No se pudo reproducir el sonido:", err);
    });
  };

  // Estado para la fila expandida (índice global)
  const [expandedRow, setExpandedRow] = useState(null);
  const handleVerDetalle = (globalIndex) => {
    setExpandedRow(expandedRow === globalIndex ? null : globalIndex);
  };

  // Estado para la paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(actividades.length / itemsPerPage);
  const paginatedActivities = actividades.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className={styles.container}>
      {/* Encabezado principal */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Registro de Eventos</h1>
          <p className={styles.subtitle}>Actividades recientes</p>
        </div>
      </div>

      {/* Tarjeta contenedora */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Actividad de Usuarios</h2>
          {/* Barra de búsqueda */}
          <div style={{ position: "relative" }}>
            <input
              type="search"
              name="search"
              placeholder="Search..."
              className={styles.searchInput}
            />
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className={styles.searchIcon}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0012.05 9.05z"
              />
            </svg>
          </div>
        </div>

        {/* Tabla de Actividades */}
        {actividades.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usuario del sistema</th>
                    <th>Acción</th>
                    <th>Fecha y Hora</th>
                    <th>Dirección IP</th>
                    <th>Agente Usuario</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedActivities.map((act, index) => {
                    // Índice global para cada actividad
                    const globalIndex = (page - 1) * itemsPerPage + index;
                    const bgColor = getRandomColorForUser(act.nombreproveedor);
                    const rowExpanded = expandedRow === globalIndex;
                    const claveConsulta = act.ClaveConsulta;
                    return (
                      <React.Fragment key={globalIndex}>
                        <tr
                          className={styles.rowHover}
                          onMouseEnter={playTapSound}
                        >
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  backgroundColor: bgColor,
                                }}
                              >
                                <FaUserCircle
                                  style={{ color: "#fff", fontSize: 16 }}
                                />
                              </div>
                              {act.nombreproveedor}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`${styles.badgeHover} ${getBadgeClasses(
                                act.Accion
                              )}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              {getActionIcon(act.Accion)}
                              {act.Accion}
                            </span>
                          </td>
                          <td>{act.FechaHora}</td>
                          <td>{act.DireccionIP}</td>
                          <td>
                            {act.AgenteUsuario?.length > 40
                              ? act.AgenteUsuario.slice(0, 40) + "..."
                              : act.AgenteUsuario}
                          </td>
                          <td>
                            {claveConsulta ? (
                              <button
                                onClick={() => handleVerDetalle(globalIndex)}
                                className={styles.detailButton}
                              >
                                {rowExpanded ? "Ocultar" : "Ver detalle"}
                              </button>
                            ) : (
                              <span style={{ color: "#aaa" }}>N/A</span>
                            )}
                          </td>
                        </tr>
                        {rowExpanded && (
                          <tr className={styles.detailRow}>
                            <td
                              colSpan={6}
                              style={{
                                background: "#f9fafb",
                                animation: "expand 0.3s ease-out",
                                padding: "1rem",
                              }}
                            >
                              {claveConsulta ? (
                                <DetalleConsulta claveConsulta={claveConsulta} />
                              ) : (
                                <p style={{ color: "#666" }}>
                                  No hay clave de consulta disponible.
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Controles de paginación */}
            <div className={styles.pagination}>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={styles.paginationButton}
              >
                Anterior
              </button>
              <span className={styles.paginationInfo}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={styles.paginationButton}
              >
                Siguiente
              </button>
            </div>
          </>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "#4b5563",
              padding: "1rem",
            }}
          >
            No hay actividad registrada.
          </p>
        )}
      </div>
    </div>
  );
}
