// src/components/DashboardActividad.jsx
import React, { useRef, useState, useEffect } from "react";
import { FaUserCircle, FaArrowLeft } from "react-icons/fa";
import { useActividades } from "../../hooks/hookActividades/useActividades";
import { getBadgeClasses } from "../../helpers/getBadgeClasses";
import { getActionIcon } from "../../helpers/getActionIcon";
import DetalleConsulta from "./components/DetalleConsulta"; // Asegúrate de la ruta correcta
import styles from "../../pages/css/estilosActividad/DashboardActividad.module.css";
import { useRouter } from "next/router";

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
  const router = useRouter();
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

  /* -------------------- BÚSQUEDA -------------------- */
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para la paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Reinicia a la primera página cuando cambia el término de búsqueda
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Filtra actividades por usuario o acción
  const filteredActivities = actividades.filter(
    (a) =>
      a.nombreproveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.Accion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  return (
    <div className={styles.container}>
      {/* Encabezado principal */}
      <div
        className={`${styles.header} flex flex-col items-center w-full mb-6 relative`}
      >
        {/* Botón Regresar */}
        <div className="absolute left-0">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Regresar</span>
          </button>
        </div>

        {/* Títulos */}
        <div className="flex flex-col items-center">
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
              placeholder="Buscar por usuario o acción…"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        {filteredActivities.length > 0 ? (
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
                              className={`${
                                styles.badgeHover
                              } ${getBadgeClasses(act.Accion)}`}
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
                                <DetalleConsulta
                                  claveConsulta={claveConsulta}
                                />
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
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
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
