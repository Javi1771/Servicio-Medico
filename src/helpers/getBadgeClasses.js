// src/helpers/getBadgeClasses.js
import styles from "../pages/css/estilosActividad/DashboardActividad.module.css";

export function getBadgeClasses(action) {
  // Normalize a minúsculas
  const normalized = action.toLowerCase();

  switch (true) {
    // --- Inicio de sesión
    case normalized === "inicio de sesión":
      return styles.greenBadge;

    // --- Consulta atendida
    case normalized === "consulta atendida":
      return styles.yellowBadge;

    // --- Consulta de signos vitales guardada
    case normalized === "consulta de signos vitales guardada":
      return styles.orangeBadge;

    // --- Asignó incapacidad
    case normalized.includes("incapacidad"):
      return styles.redBadge;

    // --- Asignó medicamentos
    case normalized.includes("medicament"):
      return styles.blueBadge;

    // --- Asignó especialidad
    case normalized.includes("especialidad"):
      return styles.purpleBadge;

    // --- Asignó enfermedad crónica
    case normalized.includes("enfermedad crónica"):
      return styles.brownBadge;

    // --- Guardó un antecedente
    case normalized === "guardó un antecedente":
      return styles.lavenderBadge;

    // --- KPI registrado (varias formas)
    case [
      "registró un kpi",
      "registrò un kpi",
      "kpi registrado",
    ].includes(normalized):
      return styles.pinkBadge; // Ejemplo

    // --- KPI calificado (varias formas)
    case ["kpi calificado", "calificò un kpi"].includes(normalized):
      return styles.cyanBadge; // Ejemplo

    // Por defecto, badge gris
    default:
      return styles.grayBadge;
  }
}
