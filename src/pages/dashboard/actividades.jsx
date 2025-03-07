import React, { useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useActividades } from "../../hooks/hookActividades/useActividades";
import { getBadgeClasses } from "../../helpers/getBadgeClasses";
import { getActionIcon } from "../../helpers/getActionIcon";
import DetalleConsulta from "./components/DetalleConsulta";
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

  // Estado para la fila expandida (índice)
  const [expandedRow, setExpandedRow] = useState(null);

  const handleVerDetalle = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

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
                {actividades.map((act, index) => {
                  const bgColor = getRandomColorForUser(act.nombreproveedor);
                  const rowExpanded = expandedRow === index;
                  // Se espera que el campo ClaveConsulta exista en el registro
                  const claveConsulta = act.ClaveConsulta;

                  return (
                    <React.Fragment key={index}>
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
                          <button
                            onClick={() => handleVerDetalle(index)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              cursor: "pointer",
                              borderRadius: "0.3rem",
                              border: "1px solid #ccc",
                              background: rowExpanded ? "#ccc" : "#eee",
                            }}
                          >
                            {rowExpanded ? "Ocultar" : "Ver detalle"}
                          </button>
                        </td>
                      </tr>
                      {rowExpanded && (
                        <tr>
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
