// src/helpers/getActionIcon.js
import React from "react";
import {
  FaSignInAlt,
  FaStethoscope,
  FaHeartbeat,
  FaUserInjured,
  FaMedkit,
  FaUserMd,
  FaProcedures,
  FaQuestion,
  FaChartLine,   // Para KPI registrado
  FaStarHalfAlt, // Para KPI calificado
  FaBookMedical, // Para "Guardó un antecedente"
  FaUserCheck,   // Para "Guardó un beneficiario"
  FaUserEdit,    // Para "Editó un beneficiario"
  FaUserMinus,   // Para "Eliminó un beneficiario"
  FaFileAlt,     // Para "Asignó antecedente"
} from "react-icons/fa";

export function getActionIcon(action) {
  const normalized = action.toLowerCase();

  switch (true) {
    case normalized === "inicio de sesión":
      return <FaSignInAlt />;
    case normalized === "consulta atendida":
      return <FaStethoscope />;
    case normalized === "consulta de signos vitales guardada":
      return <FaHeartbeat />;
    case normalized.includes("incapacidad"):
      return <FaUserInjured />;
    case normalized.includes("medicament"):
      return <FaMedkit />;
    case normalized.includes("especialidad"):
      return <FaUserMd />;
    case normalized.includes("enfermedad crónica"):
      return <FaProcedures />;
    case normalized === "guardó un antecedente":
      return <FaBookMedical />;
    case normalized.includes("guardó un beneficiario"):
      return <FaUserCheck />;
    case normalized.includes("editó un beneficiario"):
      return <FaUserEdit />;
    case normalized.includes("eliminó un beneficiario"):
      return <FaUserMinus />;
    case normalized.includes("asignó antecedente"):
      return <FaFileAlt />;
    case [
      "registró un kpi",
      "registrò un kpi",
      "kpi registrado",
    ].includes(normalized):
      return <FaChartLine />;
    case ["kpi calificado", "calificò un kpi"].includes(normalized):
      return <FaStarHalfAlt />;
    default:
      return <FaQuestion />;
  }
}
