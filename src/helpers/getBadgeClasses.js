// src/helpers/getBadgeClasses.js
import styles from "../pages/css/estilosActividad/DashboardActividad.module.css";

export function getBadgeClasses(action) {
  const normalized = action.toLowerCase();

  switch (true) {
    case normalized === "inicio de sesión":
      return styles.greenBadge;
    case normalized === "consulta atendida":
      return styles.yellowBadge;
    case normalized === "consulta de signos vitales guardada":
      return styles.orangeBadge;
    case normalized.includes("incapacidad"):
      return styles.redBadge;
    case normalized.includes("medicament"):
      return styles.blueBadge;
    case normalized.includes("especialidad"):
      return styles.purpleBadge;
    case normalized.includes("enfermedad crónica"):
      return styles.brownBadge;
    case normalized === "guardó un antecedente":
      return styles.lavenderBadge;
    case normalized.includes("guardó un beneficiario"):
      return styles.pinkBadge;
    case normalized.includes("editó un beneficiario"):
      return styles.tealBadge;
    case normalized.includes("eliminó un beneficiario"):
      return styles.darkRedBadge;
    case normalized.includes("asignó antecedente"):
      return styles.indigoBadge;
    case [
      "registró un kpi",
      "registrò un kpi",
      "kpi registrado",
    ].includes(normalized):
      return styles.pinkBadge;
    case ["kpi calificado", "calificò un kpi"].includes(normalized):
      return styles.cyanBadge;
    default:
      return styles.grayBadge;
  }
}
