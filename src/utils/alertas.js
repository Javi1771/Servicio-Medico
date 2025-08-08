// alertas.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

//* Definición de sonidos
const soundMap = {
  success: "/assets/applepay.mp3",
  error: "/assets/error.mp3",
  warning: "/assets/error.mp3",
  info: "/assets/error.mp3",
};

const playSound = (type) => {
  const soundPath = soundMap[type] || soundMap.info;
  const audio = new Audio(soundPath);
  audio.play().catch((e) => console.error("Error al reproducir sonido:", e));
};

/**
 * Muestra una alerta personalizada con sonido
 * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
 * @param {string} title - Título de la alerta (texto plano)
 * @param {string} content - Contenido de la alerta (texto plano)
 * @param {string} [confirmButtonText='Aceptar'] - Texto para el botón de confirmación
 */
export const showCustomAlert = (
  type,
  title,
  content,
  confirmButtonText = "Aceptar",
  swalOptions = {}
) => {
  //* Reproducir sonido según el tipo
  playSound(type);

  const config = {
    success: {
      icon: "success",
      color: "#00e676",
      gradient: "linear-gradient(145deg, #004d40, #00251a)",
      shadowColor: "rgba(0,230,118,0.9)",
      buttonColor: "#000",
    },
    error: {
      icon: "error",
      color: "#ff1744",
      gradient: "linear-gradient(145deg, #4a0000, #220000)",
      shadowColor: "rgba(255,23,68,0.9)",
      buttonColor: "#fff",
    },
    warning: {
      icon: "warning",
      color: "#ff9800",
      gradient: "linear-gradient(145deg, #4a2600, #220f00)",
      shadowColor: "rgba(255,152,0,0.9)",
      buttonColor: "#000",
    },
    info: {
      icon: "info",
      color: "#00bcd4",
      gradient: "linear-gradient(145deg, #004d70, #002540)",
      shadowColor: "rgba(0,188,212,0.9)",
      buttonColor: "#000",
    },
  };

  const { icon, color, gradient, shadowColor, buttonColor } =
    config[type] || config.info;

  //* Generar título con icono automático
  const iconMap = {
    success: "✔️",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const titleWithIcon = `${iconMap[type] || ""} ${title}`;

  //* Estilos en línea garantizados para el popup
  const popupStyles = `
    border: 2px solid ${color};
    border-radius: 8px;
    box-shadow: 0px 0px 20px 5px ${shadowColor};
  `;

  //* Configuración base de la alerta
  const baseConfig = {
    icon: icon,
    title: `<span style='color: ${color}; font-weight: bold; font-size: 1.5em;'>${titleWithIcon}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${content}</p>`,
    background: gradient,
    confirmButtonColor: color,
    confirmButtonText: `<span style='color: ${buttonColor}; font-weight: bold;'>${confirmButtonText}</span>`,
    customClass: {
      popup: 'custom-swal-popup', //* Clase base para referencia
    },
  };

  //* Configuración final
  const finalConfig = {
    ...baseConfig,
    ...swalOptions,
    ...(!('timer' in swalOptions) && { timer: 2000 })
  };

  //* Inyectar estilos dinámicos en el head
  const styleId = 'dynamic-swal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .custom-swal-popup {
        ${popupStyles}
      }
    `;
    document.head.appendChild(style);
  } else {
    //* Actualizar estilos si ya existen
    document.getElementById(styleId).textContent = `
      .custom-swal-popup {
        ${popupStyles}
      }
    `;
  }

  return MySwal.fire(finalConfig);
};