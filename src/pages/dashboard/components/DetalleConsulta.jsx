// src/components/DetalleConsulta.jsx
import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa"; // Ejemplo de ícono
import styles from "../../css/estilosActividad/DetalleConsulta.module.css";

export default function DetalleConsulta({ claveConsulta }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/actividad/detalleConsulta?clave=${claveConsulta}`);
        if (!resp.ok) {
          throw new Error(`Error de servidor: ${resp.status}`);
        }
        const data = await resp.json();
        setDetalle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (claveConsulta) {
      fetchDetalle();
    }
  }, [claveConsulta]);

  if (!claveConsulta) {
    return <p style={{ color: "gray" }}>No existe clave de consulta.</p>;
  }

  if (loading) {
    return <p>Cargando detalle...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  // Cada campo se renderiza como un óvalo
  return (
    <>
      {/* Paciente */}
      <div className={styles.ovalRecord}>
        <FaUserCircle className={styles.ovalIcon} />
        <div className={styles.ovalText}>
          <div className={styles.ovalField}>
            <span className={styles.ovalLabel}>Paciente:</span>
            <span className={styles.ovalValue}>{detalle.nombrepaciente}</span>
          </div>
        </div>
      </div>

      {/* Edad */}
      <div className={styles.ovalRecord}>
        <FaUserCircle className={styles.ovalIcon} />
        <div className={styles.ovalText}>
          <div className={styles.ovalField}>
            <span className={styles.ovalLabel}>Edad:</span>
            <span className={styles.ovalValue}>{detalle.edad}</span>
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div className={styles.ovalRecord}>
        <FaUserCircle className={styles.ovalIcon} />
        <div className={styles.ovalText}>
          <div className={styles.ovalField}>
            <span className={styles.ovalLabel}>Motivo:</span>
            <span className={styles.ovalValue}>{detalle.motivoconsulta}</span>
          </div>
        </div>
      </div>

      {/* Diagnóstico */}
      <div className={styles.ovalRecord}>
        <FaUserCircle className={styles.ovalIcon} />
        <div className={styles.ovalText}>
          <div className={styles.ovalField}>
            <span className={styles.ovalLabel}>Diagnóstico:</span>
            <span className={styles.ovalValue}>{detalle.diagnostico}</span>
          </div>
        </div>
      </div>

      {/* Clavenomina */}
      <div className={styles.ovalRecord}>
        <FaUserCircle className={styles.ovalIcon} />
        <div className={styles.ovalText}>
          <div className={styles.ovalField}>
            <span className={styles.ovalLabel}>Clavenomina:</span>
            <span className={styles.ovalValue}>{detalle.clavenomina}</span>
          </div>
        </div>
      </div>
    </>
  );
}
