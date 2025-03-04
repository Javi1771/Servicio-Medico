import React, { useState } from "react";
import styles from "../../css/EstilosFarmacia/SurtimientosInfo.module.css";
import {
  FaCalendarDay,
  FaIdCard,
  FaUser,
  FaUserCheck,
  FaUserClock,
  FaUserTie,
  FaUserMd,
  FaStethoscope,
  FaBuilding,
  FaInfoCircle,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";

//* Mapeo de nombres a componentes de íconos
const iconMapping = {
  "fa-calendar-day": FaCalendarDay,
  "fa-id-card": FaIdCard,
  "fa-user": FaUser,
  "fa-user-check": FaUserCheck,
  "fa-user-clock": FaUserClock,
  "fa-user-tie": FaUserTie,
  "fa-user-md": FaUserMd,
  "fa-stethoscope": FaStethoscope,
  "fa-building": FaBuilding,
  "fa-info-circle": FaInfoCircle,
  "fa-money-bill-wave": FaMoneyBillWave,
  "fa-calendar-check": FaCalendarCheck,
  "fa-users": FaUsers,
  "fa-user-shield": FaUserShield,
};

const SurtimientosInfo = ({ surtimiento, cost, setCost }) => {
  const [editingCost, setEditingCost] = useState(false);
  const estatusTexto = surtimiento?.ESTATUS ? "Receta Pendiente" : "Receta Surtida";

  const handleCostClick = () => {
    if (surtimiento?.ESTATUS) {
      setEditingCost(true);
    }
  };

  const handleCostBlur = () => {
    setEditingCost(false);
  };

  // Función para reproducir el sonido al hacer hover
  const playTapSound = () => {
    const audio = new Audio("/assets/tap.mp3");
    audio.play();
  };

  // Colores para las cards (se usan de forma cíclica)
  const availableColors = ["#00eaff", "#0095ff"];
  // Títulos destacados para aplicar fondo verde
  const highlightedTitles = ["Estatus", "Costo", "Fecha Despacho"];
  // Los campos que deben ocupar toda la fila (por textos largos)
  const fullWidthFields = new Set([
    "Nombre Paciente",
    "Diagnóstico",
    "Departamento",
    "Nombre del Médico",
  ]);

  // Lista completa de datos
  const infoCardsData = [
    {
      title: "Nombre Paciente",
      value: surtimiento?.NOMBRE_PACIENTE,
      icon: "fa-user-check",
    },
    {
      title: "Diagnóstico",
      value: surtimiento?.DIAGNOSTICO,
      icon: "fa-stethoscope",
    },
    {
      title: "Departamento",
      value: surtimiento?.DEPARTAMENTO,
      icon: "fa-building",
    },
    {
      title: "Nombre del Médico",
      value: surtimiento?.nombreproveedor,
      icon: "fa-user-md",
    },
    {
      title: "Fecha Emisión",
      value: surtimiento?.FECHA_EMISION,
      icon: "fa-calendar-day",
    },
    {
      title: "Nómina",
      value: surtimiento?.NOMINA,
      icon: "fa-id-card",
    },
    {
      title: "Edad",
      value: surtimiento?.EDAD,
      icon: "fa-user-clock",
    },
    {
      title: "Empleado",
      value:
        surtimiento?.ESEMPLEADO === "S"
          ? "Sí es empleado"
          : surtimiento?.ESEMPLEADO === "N"
          ? "No es empleado"
          : surtimiento?.ESEMPLEADO,
      icon: "fa-user-tie",
    },
    {
      title: "Sindicato",
      value: !surtimiento?.SINDICATO
        ? "No está sindicalizado"
        : surtimiento?.SINDICATO,
      icon: "fa-users",
    },
    {
      title: "Elaboró",
      value: surtimiento?.nombreproveedor || "(Sin datos)",
      icon: "fa-user-shield",
    },
    //* Campos destacados
    {
      title: "Estatus",
      value: estatusTexto,
      icon: "fa-info-circle",
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
    },
    {
      title: "Fecha Despacho",
      value: surtimiento?.FECHA_DESPACHO,
      icon: "fa-calendar-check",
    },
  ];

  // Separamos en secciones según títulos destacados
  const mainInfo = infoCardsData.filter(
    (item) => !highlightedTitles.includes(item.title)
  );
  const highlightInfo = infoCardsData.filter((item) =>
    highlightedTitles.includes(item.title)
  );

  // Función para renderizar una tarjeta individual
  const renderCard = (card, index) => {
    let color, gradient;
    if (highlightedTitles.includes(card.title)) {
      color = "#25e956";
      gradient = "#1ea709";
    } else {
      color = availableColors[index % availableColors.length];
      gradient =
        availableColors[(index + 1) % availableColors.length] || availableColors[0];
    }

    const IconComponent = iconMapping[card.icon];

    return (
      <div
        key={index}
        className={`${styles.card} surtimientosCard`}
        onMouseEnter={playTapSound}
        style={{
          background: `linear-gradient(135deg, ${color}, ${gradient})`,
          filter: "brightness(1.02) saturate(1.05)",
          borderRadius: "10px",
          padding: "1.2rem",
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
          position: "relative",
          gridColumn: fullWidthFields.has(card.title) ? "1 / -1" : undefined,
        }}
      >
        {/* Overlay oscuro para mejorar legibilidad */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.5))",
            zIndex: 0,
          }}
        ></div>

        {/* Ícono decorativo de fondo (sutil, esquina superior derecha) */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            right: "5%",
            zIndex: 0,
            opacity: 0.2,
            fontSize: "4rem",
          }}
        >
          {IconComponent && <IconComponent />}
        </div>

        {/* Contenedor del ícono principal */}
        <div
          className={styles.cardIconWrapper}
          style={{
            position: "relative",
            zIndex: 1,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
            borderRadius: "50%",
            padding: "0.6rem",
            marginBottom: "0.7rem",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "inline-block",
          }}
        >
          {IconComponent && (
            <IconComponent
              className={styles.cardIcon}
              style={{ fontSize: "1.5rem", color: "#fff" }}
            />
          )}
        </div>

        {/* Contenido principal */}
        <div
          className={styles.cardContent}
          style={{ position: "relative", zIndex: 1 }}
        >
          <h3
            className={styles.cardTitle}
            style={{
              textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
              fontWeight: "bold",
              color: "#fff",
              marginBottom: "0.4rem",
              fontSize: "1.1rem",
            }}
          >
            {card.title}
          </h3>
          <p
            className={styles.cardValue}
            style={{
              textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
              color: "#fff",
              fontSize: "1.05rem",
              lineHeight: "1.4",
            }}
          >
            {card.value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={styles.section}
      style={{ position: "relative", padding: "1rem" }}
    >
      <h2 className={styles.subtitle} style={{ marginBottom: "1.5rem", color: "#333" }}>
        Información de la Receta a Surtir
      </h2>
      {surtimiento ? (
        <>
          {/* Sección principal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              position: "relative",
            }}
          >
            {mainInfo.map((card, index) => renderCard(card, index))}
          </div>

          {/* Sección destacada */}
          <div style={{ marginTop: "2rem" }}>
            <h3
              style={{
                marginBottom: "1rem",
                color: "#555",
                fontSize: "1.2rem",
              }}
            >
              Información Destacada
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
                position: "relative",
              }}
            >
              {highlightInfo.map((card, index) => renderCard(card, index))}
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: "#555" }}>No se encontró información del surtimiento.</p>
      )}

      {/* Hover Neon Global para las cards */}
      <style jsx global>{`
        .surtimientosCard:hover {
          transform: translateY(-12px) scale(1.08) rotate(-2deg);
          box-shadow: 0 0 8px #fff, 0 0 20px #fff,
            0 0 30px rgba(255, 0, 255, 0.7), 0 0 40px rgba(255, 0, 255, 0.7);
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default SurtimientosInfo;
