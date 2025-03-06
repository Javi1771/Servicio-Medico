// src/components/DashboardActividad.jsx
import React from "react";
import { FaUserCircle } from "react-icons/fa"; // <--- Ícono de usuario
import { useActividades } from "../../hooks/hookActividades/useActividades";
import { getBadgeClasses } from "../../helpers/getBadgeClasses";
import { getActionIcon } from "../../helpers/getActionIcon";
import styles from "../../pages/css/estilosActividad/DashboardActividad.module.css";

export default function DashboardActividad() {
  const actividades = useActividades();

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
                </tr>
              </thead>
              <tbody>
                {actividades.map((act, index) => (
                  <tr key={index} className={styles.rowHover}>
                    <td>
                      {/* Contenedor del ícono + nombre */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {/* Círculo con el ícono dentro */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#ccc",
                          }}
                        >
                          <FaUserCircle
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                            }}
                          />
                        </div>
                        {/* Nombre del usuario */}
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
                    <td>{new Date(act.FechaHora).toLocaleString()}</td>
                    <td>{act.DireccionIP}</td>
                    <td>
                      {act.AgenteUsuario?.length > 40
                        ? act.AgenteUsuario.slice(0, 40) + "..."
                        : act.AgenteUsuario}
                    </td>
                  </tr>
                ))}
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
