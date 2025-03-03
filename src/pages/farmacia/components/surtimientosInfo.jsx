import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

const SurtimientosInfo = ({ surtimiento, cost, setCost }) => {
  const [editingCost, setEditingCost] = useState(false);
  const estatusTexto = surtimiento?.ESTATUS
    ? "Receta Pendiente"
    : "Receta Surtida";

  const handleCostClick = () => {
    if (surtimiento.ESTATUS) {
      setEditingCost(true);
    }
  };

  const handleCostBlur = () => {
    setEditingCost(false);
  };

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
              <strong>Clave Médico:</strong> {surtimiento.nombreproveedor}
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
          <div className={styles.infoItem} onClick={handleCostClick}>
            <i className={`fa-solid fa-money-bill-wave ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Costo:</strong>{" "}
              {surtimiento.ESTATUS ? (
                editingCost ? (
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    onBlur={handleCostBlur}
                    autoFocus
                  />
                ) : (
                  <span style={{ cursor: "pointer", marginLeft: "5px" }}>
                    {cost || "(Click para editar)"}
                  </span>
                )
              ) : (
                surtimiento.COSTO || 0
              )}
            </p>
          </div>

          {/* Fecha Despacho */}
          <div className={styles.infoItem}>
            <i className={`fa-solid fa-calendar-check ${styles.infoIcon}`}></i>
            <p className={styles.infoText}>
              <strong>Fecha Despacho:</strong> {surtimiento.FECHA_DESPACHO}
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
              <strong>Elaboró:</strong>{" "}
              {surtimiento.nombreproveedor || "(Sin datos)"}
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
