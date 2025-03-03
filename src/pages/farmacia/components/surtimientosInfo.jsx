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
      color: "#ff928b",
      gradient: "#ffb199"
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
                position: "relative",
                background: `linear-gradient(135deg, ${card.color}, ${card.gradient})`,
                // Ajusta el brillo/saturación a tu gusto:
                filter: "brightness(1.02) saturate(1.05)",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                borderRadius: "8px",
                padding: "1rem",
                overflow: "hidden"
              }}
            >
              {/* Overlay semitransparente para dar contraste al texto */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))",
                  zIndex: 0
                }}
              ></div>

              {/* Contenedor de burbujas decorativas */}
              <div className="bubbleContainer">
                <div className="bubble" style={{ top: "10%", left: "20%" }}></div>
                <div className="bubble" style={{ top: "50%", left: "70%" }}></div>
                <div className="bubble" style={{ top: "80%", left: "30%" }}></div>
              </div>

              <div
                className={styles.cardIconWrapper}
                style={{
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
                  borderRadius: "50%",
                  padding: "0.5rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "rgba(0,0,0,0.25)"
                }}
              >
                <i
                  className={`fa-solid ${card.icon} ${styles.cardIcon}`}
                  style={{ fontSize: "1.5rem", color: "#fff" }}
                ></i>
              </div>

              <div
                className={styles.cardContent}
                style={{ position: "relative", zIndex: 1 }}
              >
                <h3
                  className={styles.cardTitle}
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.6)",
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "0.3rem"
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className={styles.cardValue}
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: "0.95rem"
                  }}
                >
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No se encontró información del surtimiento.</p>
      )}

      {/* Estilos para efectos de burbujas */}
      <style jsx>{`
        .bubbleContainer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .bubble {
          position: absolute;
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: bubble 4s infinite ease-in-out;
        }
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default SurtimientosInfo;
