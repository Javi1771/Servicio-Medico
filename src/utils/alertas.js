// alertas.js
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

//* Definición de sonidos
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
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
  if (type === "success") {
    playSound(true);
  } else {
    playSound(false);
  }

  const config = {
    success: {
      icon: "success",
      color: "#00e676",
      gradient: "linear-gradient(145deg, #004d40, #00251a)",
      borderClass: "border-green-600",
      shadowColor: "rgba(0,230,118,0.9)",
      buttonColor: "#000",
    },
    error: {
      icon: "error",
      color: "#ff1744",
      gradient: "linear-gradient(145deg, #4a0000, #220000)",
      borderClass: "border-red-600",
      shadowColor: "rgba(255,23,68,0.9)",
      buttonColor: "#fff",
    },
    warning: {
      icon: "warning",
      color: "#ff9800",
      gradient: "linear-gradient(145deg, #4a2600, #220f00)",
      borderClass: "border-yellow-600",
      shadowColor: "rgba(255,152,0,0.9)",
      buttonColor: "#000",
    },
    info: {
      icon: "info",
      color: "#00bcd4",
      gradient: "linear-gradient(145deg, #004d70, #002540)",
      borderClass: "border-cyan-600",
      shadowColor: "rgba(0,188,212,0.9)",
      buttonColor: "#000",
    },
  };

  const { icon, color, gradient, borderClass, shadowColor, buttonColor } =
    config[type] || config.info;

  //* Generar título con icono automático
  const iconMap = {
    success: "✔️",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const titleWithIcon = `${iconMap[type] || ""} ${title}`;

  //! Si no se pasó timer, aplicamos 2000 ms por defecto
  const mergedOptions = {
    timer: swalOptions.timer ?? 2000,
    ...swalOptions,
  };

  return MySwal.fire({
    icon: icon,
    title: `<span style='color: ${color}; font-weight: bold; font-size: 1.5em;'>${titleWithIcon}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${content}</p>`,
    background: gradient,
    confirmButtonColor: color,
    confirmButtonText: `<span style='color: ${buttonColor}; font-weight: bold;'>${confirmButtonText}</span>`,
    customClass: {
      popup: `border ${borderClass} shadow-[0px_0px_20px_5px_${shadowColor}] rounded-lg`,
    },
    ...swalOptions,
    ...mergedOptions,
  });
};
