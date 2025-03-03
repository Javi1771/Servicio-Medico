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

  // Lista de datos para iterar y crear tarjetas
  const infoCards = [
    {
      title: "Folio Surtimiento",
      value: surtimiento?.FOLIO_SURTIMIENTO,
      icon: "fa-file-invoice",
      color: "#ff928b", // color base de la tarjeta
      gradient: "#ffb199" // color para el gradiente
    },
    {
      title: "Folio Pase",
      value: surtimiento?.FOLIO_PASE,
      icon: "fa-file-medical",
      color: "#a18cd1",
      gradient: "#fbc2eb"
    },
    {
      title: "Fecha Emisión",
      value: surtimiento?.FECHA_EMISION,
      icon: "fa-calendar-day",
      color: "#84fab0",
      gradient: "#8fd3f4"
    },
    {
      title: "Nómina",
      value: surtimiento?.NOMINA,
      icon: "fa-id-card",
      color: "#f5576c",
      gradient: "#f093fb"
    },
    {
      title: "Clave Paciente",
      value: surtimiento?.CLAVE_PACIENTE,
      icon: "fa-user",
      color: "#43e97b",
      gradient: "#38f9d7"
    },
    {
      title: "Nombre Paciente",
      value: surtimiento?.NOMBRE_PACIENTE,
      icon: "fa-user-check",
      color: "#f6d365",
      gradient: "#fda085"
    },
    {
      title: "Edad",
      value: surtimiento?.EDAD,
      icon: "fa-user-clock",
      color: "#a1c4fd",
      gradient: "#c2e9fb"
    },
    {
      title: "Empleado",
      value: surtimiento?.ESEMPLEADO,
      icon: "fa-user-tie",
      color: "#30cfd0",
      gradient: "#330867"
    },
    {
      title: "Clave Médico",
      value: surtimiento?.nombreproveedor,
      icon: "fa-user-md",
      color: "#667eea",
      gradient: "#764ba2"
    },
    {
      title: "Diagnóstico",
      value: surtimiento?.DIAGNOSTICO,
      icon: "fa-stethoscope",
      color: "#e0c3fc",
      gradient: "#8ec5fc"
    },
    {
      title: "Departamento",
      value: surtimiento?.DEPARTAMENTO,
      icon: "fa-building",
      color: "#f093fb",
      gradient: "#f5576c"
    },
    {
      title: "Estatus",
      value: estatusTexto,
      icon: "fa-info-circle",
      color: "#5ee7df",
      gradient: "#b490ca"
    },
    {
      title: "Costo",
      value: surtimiento?.ESTATUS ? (
        editingCost ? (
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onBlur={handleCostBlur}
            autoFocus
            className={styles.inputCost}
          />
        ) : (
          <span className={styles.editableText} onClick={handleCostClick}>
            {cost || "(Click para editar)"}
          </span>
        )
      ) : (
        surtimiento?.COSTO || 0
      ),
      icon: "fa-money-bill-wave",
      color: "#ff9a9e",
      gradient: "#fad0c4"
    },
    {
      title: "Fecha Despacho",
      value: surtimiento?.FECHA_DESPACHO,
      icon: "fa-calendar-check",
      color: "#fddb92",
      gradient: "#d1fdff"
    },
    {
      title: "Sindicato",
      value: surtimiento?.SINDICATO,
      icon: "fa-users",
      color: "#c2e9fb",
      gradient: "#81fbb8"
    },
    {
      title: "Elaboró",
      value: surtimiento?.nombreproveedor || "(Sin datos)",
      icon: "fa-user-shield",
      color: "#fccb90",
      gradient: "#d57eeb"
    }
  ];

  return (
    <div className={styles.section}>
      <h2 className={styles.subtitle}>Información del Surtimiento</h2>
      {surtimiento ? (
        <div className={styles.cardsGrid}>
          {infoCards.map((card, index) => (
            <div
              key={index}
              className={styles.card}
              style={{
                background: `linear-gradient(135deg, ${card.color}, ${card.gradient})`
              }}
            >
              <div className={styles.cardIconWrapper}>
                <i className={`fa-solid ${card.icon} ${styles.cardIcon}`}></i>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardValue}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No se encontró información del surtimiento.</p>
      )}
    </div>
  );
};

export default SurtimientosInfo;
