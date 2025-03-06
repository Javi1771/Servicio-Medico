// src/helpers/getActionIcon.js
import React from "react";
// Ejemplo con íconos de Font Awesome
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
} from "react-icons/fa";

export function getActionIcon(action) {
  // Convertimos la acción a minúsculas para comparar más fácilmente
  const normalized = action.toLowerCase();

  switch (true) {
    // --- Inicio de sesión
    case normalized === "inicio de sesión":
      return <FaSignInAlt />;

    // --- Consulta atendida
    case normalized === "consulta atendida":
      return <FaStethoscope />;

    // --- Consulta de signos vitales guardada
    case normalized === "consulta de signos vitales guardada":
      return <FaHeartbeat />;

    // --- Asignó incapacidad (o se asigno)
    case normalized.includes("incapacidad"):
      return <FaUserInjured />;

    // --- Asignó medicamentos
    case normalized.includes("medicament"):
      return <FaMedkit />;

    // --- Asignó especialidad
    case normalized.includes("especialidad"):
      return <FaUserMd />;

    // --- Asignó enfermedad crónica
    case normalized.includes("enfermedad crónica"):
      return <FaProcedures />;

    // --- Guardó un antecedente
    case normalized === "guardó un antecedente":
      return <FaBookMedical />;

    // --- KPI registrado (varias formas)
    case [
      "registró un kpi",
      "registrò un kpi",
      "kpi registrado",
    ].includes(normalized):
      return <FaChartLine />;

    // --- KPI calificado (varias formas)
    case ["kpi calificado", "calificò un kpi"].includes(normalized):
      return <FaStarHalfAlt />;

    // Por defecto, icono de pregunta
    default:
      return <FaQuestion />;
  }
}
