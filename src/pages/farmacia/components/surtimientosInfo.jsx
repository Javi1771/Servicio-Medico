// pages/farmacia/components/SurtimientosInfo.jsx
import React from "react";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

const SurtimientosInfo = ({ surtimiento, cost, setCost }) => {
  // Determina el texto del estatus en base al valor de la BD:
  // Si ESTATUS es 1 (pendiente) se muestra "Receta Pendiente",
  // si es 0 o 2 (ya surtida) se muestra "Receta Surtida"
  const estatusTexto =
    surtimiento?.ESTATUS === 1 ? "Receta Pendiente" : "Receta Surtida";

  return (
    <div className={styles.section}>
      <h2 className={styles.subtitle}>Información del Surtimiento</h2>
      {surtimiento ? (
        <div className={styles.info}>
          {/* Folio Surtimiento */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-file-invoice ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Folio Surtimiento:</strong> {surtimiento.FOLIO_SURTIMIENTO}
            </p>
          </div>
          {/* Folio Pase */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-file-medical ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Folio Pase:</strong> {surtimiento.FOLIO_PASE}
            </p>
          </div>
          {/* Fecha Emisión */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-calendar-day ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Fecha Emisión:</strong> {surtimiento.FECHA_EMISION}
            </p>
          </div>
          {/* Nómina */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-id-card ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Nómina:</strong> {surtimiento.NOMINA}
            </p>
          </div>
          {/* Clave Paciente */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Clave Paciente:</strong> {surtimiento.CLAVE_PACIENTE}
            </p>
          </div>
          {/* Nombre Paciente */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user-check ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Nombre Paciente:</strong> {surtimiento.NOMBRE_PACIENTE}
            </p>
          </div>
          {/* Edad */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user-clock ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Edad:</strong> {surtimiento.EDAD}
            </p>
          </div>
          {/* Empleado */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user-tie ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Empleado:</strong> {surtimiento.ESEMPLEADO}
            </p>
          </div>
          {/* Clave Médico */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user-md ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Clave Médico:</strong> {surtimiento.CLAVEMEDICO}
            </p>
          </div>
          {/* Diagnóstico */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-stethoscope ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Diagnóstico:</strong> {surtimiento.DIAGNOSTICO}
            </p>
          </div>
          {/* Departamento */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-building ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Departamento:</strong> {surtimiento.DEPARTAMENTO}
            </p>
          </div>
          {/* Estatus */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-info-circle ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Estatus:</strong> {estatusTexto}
            </p>
          </div>
          {/* Costo */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-money-bill-wave ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Costo:</strong>{" "}
              {surtimiento.ESTATUS === 1 ? (
                <input
                  type="text"
                  placeholder="Ingresa el costo ej: 5000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  style={{ width: "100px", marginLeft: "5px" }}
                />
              ) : (
                surtimiento.COSTO || 0
              )}
            </p>
          </div>
          {/* Fecha Despacho */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-calendar-check ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Fecha Despacho:</strong>{" "}
              {surtimiento.FECHA_DESPACHO || "(Pendiente)"}
            </p>
          </div>
          {/* Sindicato */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-users ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Sindicato:</strong> {surtimiento.SINDICATO}
            </p>
          </div>
          {/* Elaboró */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-user-shield ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Elaboró:</strong> {surtimiento.userName || "(Sin datos)"}
            </p>
          </div>
        </div>
      ) : (
        <p>No se encontró información del surtimiento.</p>
      )}
    </div>
  );
};

export default SurtimientosInfo;
